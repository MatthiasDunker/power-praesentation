"use client";

import { useState } from "react";
import {
  Attachment,
  AttachmentInfo,
  AttachmentPreview,
  AttachmentRemove,
  Attachments,
} from "@/components/ai-elements/attachment";
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface ChatInputPanelProps {
  isLoading: boolean;
  onSubmit: (payload: {
    prompt: string;
    contentText?: string;
    attachment?: {
      name: string;
      mimeType: "text/markdown" | "text/plain";
      text: string;
    };
  }) => Promise<void>;
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

export function ChatInputPanel({ isLoading, onSubmit }: ChatInputPanelProps) {
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
          Use one field for instructions and source content. Optionally add a
          .md/.txt attachment.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <PromptInput
          accept=".md,.txt,text/markdown,text/plain"
          aria-disabled={isLoading}
          maxFiles={1}
          maxFileSize={200_000}
          multiple={false}
          onError={(error) => setFileError(error.message)}
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

            <PromptInputSubmit className="min-w-[120px]" disabled={isLoading}>
              {isLoading ? "Generating..." : "Generate deck"}
            </PromptInputSubmit>
          </PromptInputFooter>
        </PromptInput>

        {fileError ? (
          <p className="mt-2 text-sm font-medium text-red-700">{fileError}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
