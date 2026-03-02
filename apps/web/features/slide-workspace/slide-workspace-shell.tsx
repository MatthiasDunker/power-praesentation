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
import {
  parseDeckMarkdown,
  parseFrontmatter,
  splitDeckMarkdownForEditing,
  toSlideDocuments
} from "@power/shared";
import { SlideRuntimeStyleSheet } from "@power/ui";
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
const markdownParseDebounceMs = 180;
const slideSeparator = "\n\n---\n\n";

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

function stableSerialize(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((entry) => stableSerialize(entry)).join(",")}]`;
  }

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const sortedKeys = Object.keys(record).sort();
    return `{${sortedKeys
      .map((key) => `${JSON.stringify(key)}:${stableSerialize(record[key])}`)
      .join(",")}}`;
  }

  return JSON.stringify(value);
}

function toFrontmatterStyleSignature(rawMarkdown: string): string {
  const parsed = parseFrontmatter(rawMarkdown.trimStart());
  const keys = Object.keys(parsed.frontmatterData).sort();
  const normalized: Record<string, unknown> = {};
  for (const key of keys) {
    normalized[key] = parsed.frontmatterData[key];
  }

  const bodyStructure = parsed.bodyMarkdown
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => {
      if (line === ":::") {
        return "container-close";
      }

      const containerOpen = line.match(/^:::\s*([a-zA-Z0-9_-]+)/);
      if (containerOpen) {
        return `container-open:${containerOpen[1]}`;
      }

      const heading = line.match(/^(#{1,6})\s+/);
      if (heading) {
        return `heading:${heading[1].length}`;
      }

      if (/^[-*+]\s+/.test(line)) {
        return "list-item:unordered";
      }

      if (/^\d+\.\s+/.test(line)) {
        return "list-item:ordered";
      }

      if (/^>\s*/.test(line)) {
        return "blockquote";
      }

      if (/^```/.test(line)) {
        return "code-fence";
      }

      return "paragraph";
    })
    .join("|");

  return `${stableSerialize(normalized)}::${bodyStructure}`;
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
  const markdownParseTimeoutRef = useRef<number | null>(null);
  const deckRef = useRef<DeckDocument | null>(null);
  const selectedSlideIdRef = useRef<string | null>(null);

  useEffect(() => {
    deckRef.current = deck;
  }, [deck]);

  useEffect(() => {
    selectedSlideIdRef.current = selectedSlideId;
  }, [selectedSlideId]);

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
      if (markdownParseTimeoutRef.current !== null) {
        window.clearTimeout(markdownParseTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!deckRef.current) {
      return;
    }

    if (markdownParseTimeoutRef.current !== null) {
      window.clearTimeout(markdownParseTimeoutRef.current);
    }

    markdownParseTimeoutRef.current = window.setTimeout(() => {
      markdownParseTimeoutRef.current = null;
      const activeDeck = deckRef.current;
      if (!activeDeck) {
        return;
      }

      const parsed = parseDeckMarkdown(markdownText);
      const parsedSlides = toSlideDocuments(parsed);
      const editorSegments = splitDeckMarkdownForEditing(markdownText);

      if (editorSegments.length !== parsedSlides.length) {
        return;
      }

      const nextDeck: DeckDocument = {
        ...activeDeck,
        slides: parsedSlides,
        fullMarkdown: parsed.normalizedMarkdown
      };

      setDeck(nextDeck);

      const currentSelectedSlideId = selectedSlideIdRef.current;
      if (parsedSlides.length === 0) {
        if (currentSelectedSlideId !== null) {
          setSelectedSlideId(null);
        }
        return;
      }

      if (
        currentSelectedSlideId &&
        parsedSlides.some((slide) => slide.id === currentSelectedSlideId)
      ) {
        return;
      }

      const previousSelectionIndex = activeDeck.slides.findIndex(
        (slide) => slide.id === currentSelectedSlideId
      );
      const fallbackIndex =
        previousSelectionIndex >= 0
          ? Math.min(previousSelectionIndex, parsedSlides.length - 1)
          : 0;
      setSelectedSlideId(parsedSlides[fallbackIndex]?.id ?? parsedSlides[0]?.id ?? null);
    }, markdownParseDebounceMs);

    return () => {
      if (markdownParseTimeoutRef.current !== null) {
        window.clearTimeout(markdownParseTimeoutRef.current);
        markdownParseTimeoutRef.current = null;
      }
    };
  }, [markdownText, deck?.deckId]);

  const displaySlides = useMemo(() => {
    if (phase === "workspace") {
      return deck?.slides ?? [];
    }

    return previewSlides;
  }, [phase, deck, previewSlides]);
  const templateSignature = useMemo(() => {
    const layouts = Array.from(
      new Set(displaySlides.map((slide) => slide.layout))
    ).sort();
    const frontmatterSignature = displaySlides
      .map((slide) => `${slide.id}:${toFrontmatterStyleSignature(slide.rawMarkdown)}`)
      .join("||");

    return `${layouts.join("|")}::${frontmatterSignature}`;
  }, [displaySlides]);

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
  };

  const deleteSlideFromNav = (slideId: string) => {
    const activeDeck = deckRef.current;
    if (!activeDeck) {
      return;
    }

    const deletedSlideIndex = activeDeck.slides.findIndex(
      (slide) => slide.id === slideId,
    );
    if (deletedSlideIndex < 0) {
      return;
    }

    if (navSelectionTimeoutRef.current !== null) {
      window.clearTimeout(navSelectionTimeoutRef.current);
      navSelectionTimeoutRef.current = null;
    }

    const markdownSegments = splitDeckMarkdownForEditing(markdownText);
    const sourceSegments =
      markdownSegments.length === activeDeck.slides.length
        ? markdownSegments
        : activeDeck.slides.map((slide) => slide.rawMarkdown);
    const nextMarkdown = sourceSegments
      .filter((_, index) => index !== deletedSlideIndex)
      .join(slideSeparator);

    const parsed = parseDeckMarkdown(nextMarkdown);
    const parsedSlides = toSlideDocuments(parsed);

    const nextDeck: DeckDocument = {
      ...activeDeck,
      slides: parsedSlides,
      fullMarkdown: parsed.normalizedMarkdown,
    };

    setDeck(nextDeck);
    setMarkdownText(nextDeck.fullMarkdown);

    const currentSelectedSlideId = selectedSlideIdRef.current;
    if (parsedSlides.length === 0) {
      setSelectedSlideId(null);
      return;
    }

    const previousSelectionIndex = activeDeck.slides.findIndex(
      (slide) => slide.id === currentSelectedSlideId,
    );
    let nextSelectedIndex =
      previousSelectionIndex >= 0
        ? previousSelectionIndex
        : Math.min(deletedSlideIndex, parsedSlides.length - 1);

    if (
      previousSelectionIndex >= 0 &&
      deletedSlideIndex < previousSelectionIndex
    ) {
      nextSelectedIndex -= 1;
    }

    nextSelectedIndex = Math.min(
      Math.max(0, nextSelectedIndex),
      parsedSlides.length - 1,
    );

    const nextSelectedSlideId = parsedSlides[nextSelectedIndex]?.id ?? null;
    setSelectedSlideId(nextSelectedSlideId);

    if (nextSelectedSlideId) {
      emitSelectionSignal(nextSelectedSlideId, "nav");
      emitThumbnailLiveSignal(nextSelectedSlideId, "select");
    }
  };

  return (
    <main className="min-h-screen text-zinc-900">
      <SlideRuntimeStyleSheet templateSignature={templateSignature} />
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
          onDeleteSlide={deleteSlideFromNav}
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
