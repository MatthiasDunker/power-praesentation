"use client";

import type {
  DeckDocument,
  GenerateDeckRequest,
  GenerationTaskId,
  InferredContext,
  OutlineItem,
  RuleSet,
} from "@power/contracts";
import { useState } from "react";
import {
  Attachment,
  AttachmentInfo,
  AttachmentPreview,
  AttachmentRemove,
  Attachments,
} from "@/components/ai-elements/attachment";
import {
  ChainOfThought,
  ChainOfThoughtContent,
  ChainOfThoughtHeader,
  ChainOfThoughtStep,
} from "@/components/ai-elements/chain-of-thought";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent } from "@/components/ai-elements/message";
import type { PromptInputMessage } from "@/components/ai-elements/prompt-input";
import {
  PromptInput,
  PromptInputActionAddAttachments,
  PromptInputActionMenu,
  PromptInputActionMenuContent,
  PromptInputActionMenuTrigger,
  PromptInputBody,
  PromptInputFooter,
  PromptInputHeader,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
  usePromptInputAttachments,
} from "@/components/ai-elements/prompt-input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type ChainStepStatus = "pending" | "active" | "complete";

export interface GenerationTaskState {
  id: GenerationTaskId;
  status: "pending" | "running" | "completed" | "error";
  message: string;
}

export interface ConversationUserMessage {
  prompt: string;
  attachmentName?: string;
}

interface ChatGenerationConversationProps {
  isLoading: boolean;
  onSubmit: (payload: GenerateDeckRequest) => Promise<void>;
  tasks: GenerationTaskState[];
  error: string | null;
  deck: DeckDocument | null;
  inferredContext: InferredContext | null;
  ruleset: RuleSet | null;
  outline: OutlineItem[];
  userMessage: ConversationUserMessage | null;
}

const acceptedTypes = ["text/markdown", "text/plain"] as const;

function resolveMimeType(file: File): "text/markdown" | "text/plain" | null {
  if (acceptedTypes.includes(file.type as (typeof acceptedTypes)[number])) {
    return file.type as "text/markdown" | "text/plain";
  }

  const lowered = file.name.toLowerCase();
  if (lowered.endsWith(".md")) {
    return "text/markdown";
  }

  if (lowered.endsWith(".txt")) {
    return "text/plain";
  }

  return null;
}

function statusVariant(
  status: GenerationTaskState["status"],
): "default" | "secondary" | "outline" | "destructive" {
  if (status === "completed") {
    return "secondary";
  }

  if (status === "running") {
    return "outline";
  }

  if (status === "error") {
    return "destructive";
  }

  return "default";
}

function taskStepStatus(
  status: GenerationTaskState["status"],
): ChainStepStatus {
  if (status === "completed") {
    return "complete";
  }

  if (status === "running") {
    return "active";
  }

  return "pending";
}

function AttachmentPreviewList() {
  const attachments = usePromptInputAttachments();

  if (attachments.files.length === 0) {
    return null;
  }

  return (
    <Attachments className="mb-2" variant="inline">
      {attachments.files.map((attachment) => (
        <Attachment
          data={attachment}
          key={attachment.id}
          onRemove={() => attachments.remove(attachment.id)}
        >
          <AttachmentPreview />
          <AttachmentInfo />
          <AttachmentRemove />
        </Attachment>
      ))}
    </Attachments>
  );
}

export function ChatGenerationConversation({
  isLoading,
  onSubmit,
  tasks,
  error,
  deck,
  inferredContext,
  ruleset,
  outline,
  userMessage,
}: ChatGenerationConversationProps) {
  const [fileError, setFileError] = useState<string | null>(null);

  const submit = async (message: PromptInputMessage) => {
    const prompt = message.text?.trim() ?? "";
    if (!prompt) {
      return;
    }

    const firstFile = message.files?.[0];
    let attachment:
      | { name: string; mimeType: "text/markdown" | "text/plain"; text: string }
      | undefined;

    if (firstFile) {
      const mimeType = resolveMimeType(firstFile);
      if (!mimeType) {
        setFileError("Only .md and .txt files are supported.");
        return;
      }

      attachment = {
        name: firstFile.name,
        mimeType,
        text: await firstFile.text(),
      };
      setFileError(null);
    }

    await onSubmit({
      prompt,
      attachment,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Markdown to Slide Deck</CardTitle>
        <CardDescription>
          Chat with the generator: your prompt appears as a message, and the
          generation chain streams as the assistant response.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <Conversation className="h-[420px] rounded-lg border">
          <ConversationContent className="gap-4">
            {userMessage ? (
              <>
                <Message from="user">
                  <MessageContent>
                    <p className="whitespace-pre-wrap">{userMessage.prompt}</p>
                    {userMessage.attachmentName ? (
                      <p className="text-xs text-zinc-600">
                        Attachment: {userMessage.attachmentName}
                      </p>
                    ) : null}
                  </MessageContent>
                </Message>

                <Message from="assistant">
                  <MessageContent className="w-full py-3">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <span className="font-medium text-sm">
                        Generation Chain
                      </span>
                      {deck ? (
                        <Badge variant="secondary">Deck ready</Badge>
                      ) : null}
                    </div>

                    <ChainOfThought defaultOpen>
                      <ChainOfThoughtHeader>
                        Pipeline tasks
                      </ChainOfThoughtHeader>
                      <ChainOfThoughtContent className="flex flex-col">
                        {tasks.map((task) => (
                          <ChainOfThoughtStep
                            key={task.id}
                            label={task.message}
                            status={taskStepStatus(task.status)}
                          >
                            <Badge variant={statusVariant(task.status)}>
                              {task.status}
                            </Badge>
                          </ChainOfThoughtStep>
                        ))}
                      </ChainOfThoughtContent>
                    </ChainOfThought>

                    <ChainOfThought
                      className="mt-3"
                      defaultOpen={Boolean(deck)}
                    >
                      <ChainOfThoughtHeader>Artifacts</ChainOfThoughtHeader>
                      <ChainOfThoughtContent>
                        <ChainOfThoughtStep
                          label="Inferred context"
                          status={inferredContext ? "complete" : "pending"}
                        >
                          <pre className="max-h-40 overflow-auto rounded-md border border-zinc-200 bg-white p-2 text-xs">
                            {inferredContext
                              ? JSON.stringify(inferredContext, null, 2)
                              : "pending"}
                          </pre>
                        </ChainOfThoughtStep>

                        <ChainOfThoughtStep
                          label="Ruleset"
                          status={ruleset ? "complete" : "pending"}
                        >
                          <pre className="max-h-40 overflow-auto rounded-md border border-zinc-200 bg-white p-2 text-xs">
                            {ruleset
                              ? JSON.stringify(ruleset, null, 2)
                              : "pending"}
                          </pre>
                        </ChainOfThoughtStep>

                        <ChainOfThoughtStep
                          label="Outline"
                          status={outline.length > 0 ? "complete" : "pending"}
                        >
                          <pre className="max-h-40 overflow-auto rounded-md border border-zinc-200 bg-white p-2 text-xs">
                            {outline.length > 0
                              ? JSON.stringify(outline, null, 2)
                              : "pending"}
                          </pre>
                        </ChainOfThoughtStep>
                      </ChainOfThoughtContent>
                    </ChainOfThought>

                    {error ? (
                      <p className="mt-3 text-sm font-medium text-red-700">
                        {error}
                      </p>
                    ) : null}

                    {deck ? (
                      <p className="mt-2 text-sm text-zinc-700">
                        Generated {deck.slides.length} slides in deck{" "}
                        <code className="rounded bg-zinc-100 px-1.5 py-0.5">
                          {deck.deckId}
                        </code>
                      </p>
                    ) : null}
                  </MessageContent>
                </Message>
              </>
            ) : (
              <ConversationEmptyState
                description="Submit a prompt to start the generation conversation."
                title="No conversation yet"
              />
            )}
          </ConversationContent>

          <ConversationScrollButton />
        </Conversation>

        <PromptInput
          accept=".md,.txt,text/markdown,text/plain"
          aria-disabled={isLoading}
          maxFiles={1}
          maxFileSize={200_000}
          multiple={false}
          onError={(inputError) => setFileError(inputError.message)}
          onSubmit={(message) => void submit(message)}
        >
          <PromptInputHeader>
            <AttachmentPreviewList />
          </PromptInputHeader>

          <PromptInputBody>
            <PromptInputTextarea
              aria-label="Prompt"
              placeholder="Write instructions and/or source content here. Example: Create a clear executive deck about Q1 performance for a non-technical audience..."
            />
          </PromptInputBody>

          <PromptInputFooter>
            <PromptInputTools>
              <PromptInputActionMenu>
                <PromptInputActionMenuTrigger />
                <PromptInputActionMenuContent>
                  <PromptInputActionAddAttachments label="Add .md/.txt" />
                </PromptInputActionMenuContent>
              </PromptInputActionMenu>
            </PromptInputTools>

            <PromptInputSubmit
              aria-label="Generate deck"
              className="min-w-[120px]"
              disabled={isLoading}
            >
              {isLoading ? "Generating..." : "Generate deck"}
            </PromptInputSubmit>
          </PromptInputFooter>
        </PromptInput>

        {fileError ? (
          <p className="text-sm font-medium text-red-700">{fileError}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
