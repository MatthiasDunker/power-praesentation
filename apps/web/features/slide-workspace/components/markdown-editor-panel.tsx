"use client";

import { useEffect, useMemo, useRef } from "react";
import { parseDeckMarkdown } from "@power/shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface MarkdownEditorPanelProps {
  markdown: string;
  selectedSlideId: string | null;
  onChange: (markdown: string) => void;
  onSelectSlide: (slideId: string) => void;
  onSlideEdit?: (slideId: string) => void;
}

interface SlideEditorEntry {
  id: string;
  markdown: string;
}

const separator = "\n\n---\n\n";

function resizeTextarea(node: HTMLTextAreaElement | null) {
  if (!node) {
    return;
  }

  node.style.height = "auto";
  node.style.height = `${node.scrollHeight}px`;
}

export function MarkdownEditorPanel({
  markdown,
  selectedSlideId,
  onChange,
  onSelectSlide,
  onSlideEdit
}: MarkdownEditorPanelProps) {
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const textareaRefs = useRef<Map<string, HTMLTextAreaElement>>(new Map());

  const slideEditors = useMemo<SlideEditorEntry[]>(() => {
    const parsed = parseDeckMarkdown(markdown);
    const separatorSegments = markdown.includes(separator)
      ? markdown.split(separator)
      : null;
    const trailingWhitespace = markdown.match(/\s+$/)?.[0] ?? "";

    if (parsed.slides.length === 0) {
      return [
        {
          id: "slide-1",
          markdown
        }
      ];
    }

    // Preserve per-slide trailing whitespace/newlines while users edit.
    // This works for the editor's own joined format and avoids losing Enter presses.
    if (separatorSegments && separatorSegments.length === parsed.slides.length) {
      return parsed.slides.map((slide, index) => ({
        id: slide.id,
        markdown: separatorSegments[index] ?? slide.rawMarkdown
      }));
    }

    return parsed.slides.map((slide, index) => ({
      id: slide.id,
      markdown:
        index === parsed.slides.length - 1
          ? `${slide.rawMarkdown}${trailingWhitespace}`
          : slide.rawMarkdown
    }));
  }, [markdown]);
  const slideStructureKey = useMemo(
    () => slideEditors.map((slide) => slide.id).join("|"),
    [slideEditors]
  );

  useEffect(() => {
    if (!slideStructureKey) {
      return;
    }

    for (const slideId of slideStructureKey.split("|")) {
      resizeTextarea(textareaRefs.current.get(slideId) ?? null);
    }
  }, [slideStructureKey]);

  useEffect(() => {
    if (!selectedSlideId) {
      return;
    }

    const selectedEditor = textareaRefs.current.get(selectedSlideId);
    const container = editorContainerRef.current;
    if (!selectedEditor || !container) {
      return;
    }

    const containerRect = container.getBoundingClientRect();
    const editorRect = selectedEditor.getBoundingClientRect();
    const editorTop = editorRect.top - containerRect.top + container.scrollTop;
    const maxScrollTop = Math.max(0, container.scrollHeight - container.clientHeight);
    const shouldCenter = editorRect.height <= container.clientHeight;
    const rawTarget = shouldCenter
      ? editorTop - (container.clientHeight - editorRect.height) / 2
      : editorTop;

    container.scrollTop = Math.min(maxScrollTop, Math.max(0, rawTarget));
  }, [selectedSlideId, slideStructureKey]);

  const handleSlideChange = (slideId: string, nextSlideMarkdown: string) => {
    const nextMarkdown = slideEditors
      .map((slide) => (slide.id === slideId ? { ...slide, markdown: nextSlideMarkdown } : slide))
      .map((slide) => slide.markdown)
      .join(separator);

    onChange(nextMarkdown);
  };

  return (
    <Card className="min-h-[72vh] print:hidden">
      <CardHeader>
        <CardTitle>Deck markdown</CardTitle>
      </CardHeader>
      <CardContent>
        <div
          aria-label="Deck markdown editor"
          className="deck-markdown-editor min-h-[64vh] max-h-[64vh] resize-y overflow-auto rounded-md border border-input"
          ref={editorContainerRef}
          role="group"
        >
          {slideEditors.map((slide, index) => {
            const isActive = selectedSlideId ? selectedSlideId === slide.id : index === 0;

            return (
              <textarea
                aria-label={`Deck markdown for slide ${index + 1}`}
                className="deck-slide-textarea block w-full border-0 bg-transparent px-3 py-2 font-mono text-xs leading-6 shadow-none focus-visible:outline-none"
                data-active={isActive ? "true" : "false"}
                key={slide.id}
                onChange={(event) => {
                  resizeTextarea(event.target);
                  handleSlideChange(slide.id, event.target.value);
                }}
                onFocus={() => onSelectSlide(slide.id)}
                ref={(node) => {
                  if (node) {
                    textareaRefs.current.set(slide.id, node);
                    return;
                  }

                  textareaRefs.current.delete(slide.id);
                }}
                spellCheck={false}
                value={slide.markdown}
              />
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
