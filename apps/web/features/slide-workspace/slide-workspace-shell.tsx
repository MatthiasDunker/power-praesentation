"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type {
  DeckDocument,
  GenerateDeckRequest,
  GenerationStreamEvent,
  GenerationTaskId,
  InferredContext,
  OutlineItem,
  RuleSet,
  SlideDocument,
} from "@power/contracts";
import { parseDeckMarkdown, toSlideDocuments } from "@power/shared";
import {
  ChatGenerationConversation,
  type ConversationUserMessage,
  type GenerationTaskState,
} from "@/features/chat-input/chat-generation-conversation";
import { MarkdownEditorPanel } from "@/features/slide-workspace/components/markdown-editor-panel";
import { SlideCanvas } from "@/features/slide-workspace/components/slide-canvas";
import {
  SlideNav,
  type SlideSelectionSignal,
  type SlideThumbnailLiveSignal,
} from "@/features/slide-workspace/components/slide-nav";
import { cn } from "@/lib/utils";

const storageKey = "power.deck.current";
const navSelectionDelayMs = 90;

const taskOrder: GenerationTaskId[] = [
  "ingest_input",
  "infer_context",
  "derive_ruleset",
  "build_outline",
  "match_templates",
  "compose_slides",
];

function createInitialTasks(): GenerationTaskState[] {
  return taskOrder.map((id) => ({
    id,
    status: "pending",
    message: "waiting",
  }));
}

function updateTask(
  tasks: GenerationTaskState[],
  taskId: GenerationTaskId,
  status: GenerationTaskState["status"],
  message: string,
): GenerationTaskState[] {
  return tasks.map((task) =>
    task.id === taskId
      ? {
          ...task,
          status,
          message,
        }
      : task,
  );
}

async function* streamEvents(
  payload: GenerateDeckRequest,
): AsyncGenerator<GenerationStreamEvent> {
  const response = await fetch("/api/decks/generate", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok || !response.body) {
    throw new Error("Failed to start generation stream.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const chunks = buffer.split("\n\n");
    buffer = chunks.pop() ?? "";

    for (const chunk of chunks) {
      const dataLine = chunk
        .split("\n")
        .find((line) => line.startsWith("data: "))
        ?.slice(6);

      if (!dataLine) {
        continue;
      }

      yield JSON.parse(dataLine) as GenerationStreamEvent;
    }
  }
}

export function SlideWorkspaceShell() {
  const [phase, setPhase] = useState<"input" | "generating" | "workspace">(
    "input",
  );
  const [tasks, setTasks] = useState<GenerationTaskState[]>(createInitialTasks);
  const [error, setError] = useState<string | null>(null);
  const [inferredContext, setInferredContext] =
    useState<InferredContext | null>(null);
  const [ruleset, setRuleset] = useState<RuleSet | null>(null);
  const [outline, setOutline] = useState<OutlineItem[]>([]);
  const [deck, setDeck] = useState<DeckDocument | null>(null);
  const [previewSlides, setPreviewSlides] = useState<SlideDocument[]>([]);
  const [selectedSlideId, setSelectedSlideId] = useState<string | null>(null);
  const [selectionSignal, setSelectionSignal] =
    useState<SlideSelectionSignal | null>(null);
  const [thumbnailLiveSignal, setThumbnailLiveSignal] =
    useState<SlideThumbnailLiveSignal | null>(null);
  const [markdownText, setMarkdownText] = useState("");
  const [userMessage, setUserMessage] =
    useState<ConversationUserMessage | null>(null);
  const selectionSignalNonceRef = useRef(0);
  const thumbnailSignalNonceRef = useRef(0);
  const navSelectionTimeoutRef = useRef<number | null>(null);

  const emitSelectionSignal = (
    slideId: string,
    source: SlideSelectionSignal["source"],
  ) => {
    selectionSignalNonceRef.current += 1;
    setSelectionSignal({
      slideId,
      source,
      nonce: selectionSignalNonceRef.current,
    });
  };

  const emitThumbnailLiveSignal = (
    slideId: string,
    source: SlideThumbnailLiveSignal["source"],
  ) => {
    thumbnailSignalNonceRef.current += 1;
    setThumbnailLiveSignal({
      slideId,
      source,
      nonce: thumbnailSignalNonceRef.current,
    });
  };

  const selectSlideFromNav = (slideId: string) => {
    if (navSelectionTimeoutRef.current !== null) {
      window.clearTimeout(navSelectionTimeoutRef.current);
    }

    navSelectionTimeoutRef.current = window.setTimeout(() => {
      navSelectionTimeoutRef.current = null;
      setSelectedSlideId(slideId);
      emitSelectionSignal(slideId, "nav");
    }, navSelectionDelayMs);
  };

  const selectSlideFromMarkdown = (slideId: string) => {
    setSelectedSlideId(slideId);
    emitSelectionSignal(slideId, "markdown");
    emitThumbnailLiveSignal(slideId, "select");
  };

  const onSlideEdit = (slideId: string) => {
    emitThumbnailLiveSignal(slideId, "edit");
  };

  useEffect(() => {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) {
      return;
    }

    try {
      const parsed = JSON.parse(raw) as DeckDocument;
      setDeck(parsed);
      setMarkdownText(parsed.fullMarkdown);
      setSelectedSlideId(parsed.slides[0]?.id ?? null);
      setInferredContext(parsed.inferredContext);
      setRuleset(parsed.ruleset);
      setOutline(parsed.outline);
      setPhase("workspace");
      setTasks(
        taskOrder.map((id) => ({
          id,
          status: "completed",
          message: "completed",
        })),
      );
    } catch {
      window.localStorage.removeItem(storageKey);
    }
  }, []);

  useEffect(() => {
    if (!deck) {
      return;
    }

    window.localStorage.setItem(storageKey, JSON.stringify(deck));
  }, [deck]);

  useEffect(() => {
    return () => {
      if (navSelectionTimeoutRef.current !== null) {
        window.clearTimeout(navSelectionTimeoutRef.current);
      }
    };
  }, []);

  const displaySlides = useMemo(() => {
    if (phase === "workspace") {
      return deck?.slides ?? [];
    }

    return previewSlides;
  }, [phase, deck, previewSlides]);

  const submitPrompt = async (payload: GenerateDeckRequest) => {
    setUserMessage({
      prompt: payload.prompt,
      attachmentName: payload.attachment?.name,
    });
    setPhase("generating");
    setTasks(createInitialTasks());
    setError(null);
    setPreviewSlides([]);
    setDeck(null);
    setInferredContext(null);
    setRuleset(null);
    setOutline([]);

    try {
      for await (const event of streamEvents(payload)) {
        if (event.type === "task_started") {
          setTasks((current) =>
            updateTask(current, event.taskId, "running", event.message),
          );
          continue;
        }

        if (event.type === "task_progress") {
          setTasks((current) =>
            updateTask(current, event.taskId, "running", event.message),
          );
          continue;
        }

        if (event.type === "task_completed") {
          setTasks((current) =>
            updateTask(current, event.taskId, "completed", event.message),
          );
          continue;
        }

        if (event.type === "slide_partial") {
          setPreviewSlides((current) => {
            const withoutSame = current.filter(
              (slide) => slide.id !== event.slide.id,
            );
            return [...withoutSame, event.slide].sort((left, right) =>
              left.id.localeCompare(right.id),
            );
          });
          continue;
        }

        if (event.type === "deck_completed") {
          setDeck(event.deck);
          setMarkdownText(event.deck.fullMarkdown);
          setSelectedSlideId(event.deck.slides[0]?.id ?? null);
          setInferredContext(event.deck.inferredContext);
          setRuleset(event.deck.ruleset);
          setOutline(event.deck.outline);
          setPhase("workspace");
          continue;
        }

        if (event.type === "generation_error") {
          setError(event.message);
          const taskId = event.taskId;
          if (taskId) {
            setTasks((current) =>
              updateTask(current, taskId, "error", event.message),
            );
          }
          setPhase("input");
        }
      }
    } catch (streamError) {
      const message =
        streamError instanceof Error
          ? streamError.message
          : "Unknown stream error";
      setError(message);
      setPhase("input");
    }
  };

  const onMarkdownChange = (nextMarkdown: string) => {
    setMarkdownText(nextMarkdown);

    if (!deck) {
      return;
    }

    const parsed = parseDeckMarkdown(nextMarkdown);
    const slides = toSlideDocuments(parsed);
    const nextDeck: DeckDocument = {
      ...deck,
      slides,
      fullMarkdown: parsed.normalizedMarkdown,
    };

    setDeck(nextDeck);
    if (
      slides.length > 0 &&
      !slides.some((slide) => slide.id === selectedSlideId)
    ) {
      setSelectedSlideId(slides[0].id);
    }
  };

  return (
    <main className="min-h-screen text-zinc-900">
      <section
        className={cn(
          "grid gap-4 print:hidden",
          phase === "workspace" && "xl:grid-cols-[1fr]",
        )}
        data-testid="top-chat-shell"
      >
        <ChatGenerationConversation
          isLoading={phase === "generating"}
          onSubmit={submitPrompt}
          tasks={tasks}
          error={error}
          deck={deck}
          inferredContext={inferredContext}
          ruleset={ruleset}
          outline={outline}
          userMessage={userMessage}
        />
      </section>

      <section
        className="grid h-screen gap-4 lg:grid-cols-[220px_minmax(0,1fr)_360px] print:block"
        data-testid="workspace-shell"
      >
        <SlideNav
          slides={displaySlides}
          selectionSignal={selectionSignal}
          liveSignal={thumbnailLiveSignal}
          selectedSlideId={selectedSlideId}
          onSelectSlide={selectSlideFromNav}
        />
        <SlideCanvas slides={displaySlides} activeSlideId={selectedSlideId} />
        <MarkdownEditorPanel
          markdown={markdownText}
          selectedSlideId={selectedSlideId}
          onChange={onMarkdownChange}
          onSelectSlide={selectSlideFromMarkdown}
          onSlideEdit={onSlideEdit}
        />
      </section>
    </main>
  );
}
