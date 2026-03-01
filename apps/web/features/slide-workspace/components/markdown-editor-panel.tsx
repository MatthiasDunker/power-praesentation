"use client";

import { useEffect, useMemo, useRef } from "react";
import type { SlideDiagnostic } from "@power/contracts";
import {
  parseSingleSlideMarkdown,
  splitDeckMarkdownForEditingDetailed,
} from "@power/shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { DownloadIcon, OctagonX, TriangleAlert } from "lucide-react";

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
  diagnostics: SlideDiagnostic[];
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
  onSlideEdit,
}: MarkdownEditorPanelProps) {
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const textareaRefs = useRef<Map<string, HTMLTextAreaElement>>(new Map());

  const slideEditors = useMemo<SlideEditorEntry[]>(() => {
    const segments = splitDeckMarkdownForEditingDetailed(markdown);

    if (segments.length === 0) {
      return [
        {
          id: "slide-1",
          markdown,
          diagnostics: [],
        },
      ];
    }

    return segments.map((segment, index) => {
      const slideId = `slide-${index + 1}`;
      const parseResult = parseSingleSlideMarkdown(segment.markdown, {
        id: slideId,
        recoveredBoundary: segment.recoveredBoundary,
      });

      return {
        id: slideId,
        markdown: segment.markdown,
        diagnostics: parseResult.diagnostics,
      };
    });
  }, [markdown]);
  const slideStructureKey = useMemo(
    () => slideEditors.map((slide) => slide.id).join("|"),
    [slideEditors],
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
    const maxScrollTop = Math.max(
      0,
      container.scrollHeight - container.clientHeight,
    );
    const shouldCenter = editorRect.height <= container.clientHeight;
    const rawTarget = shouldCenter
      ? editorTop - (container.clientHeight - editorRect.height) / 2
      : editorTop;

    container.scrollTop = Math.min(maxScrollTop, Math.max(0, rawTarget));
  }, [selectedSlideId, slideStructureKey]);

  const handleSlideChange = (slideId: string, nextSlideMarkdown: string) => {
    const nextMarkdown = slideEditors
      .map((slide) =>
        slide.id === slideId
          ? { ...slide, markdown: nextSlideMarkdown }
          : slide,
      )
      .map((slide) => slide.markdown)
      .join(separator);

    onChange(nextMarkdown);
  };

  const handleExportMarkdown = () => {
    const blob = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "deck-content.md";
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="min-h-[72vh] print:hidden">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>Content</span>
          <Button
            aria-label="Export markdown"
            className="h-6 w-6 text-muted-foreground hover:text-foreground"
            onClick={handleExportMarkdown}
            size="icon"
            title="Export markdown"
            type="button"
            variant="ghost"
          >
            <DownloadIcon className="size-3.5" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div
          aria-label="Deck markdown editor"
          className="deck-markdown-editor min-h-[64vh] max-h-[64vh] resize-y overflow-auto rounded-md border border-input"
          ref={editorContainerRef}
          role="group"
        >
          {slideEditors.map((slide, index) => {
            const isActive = selectedSlideId
              ? selectedSlideId === slide.id
              : index === 0;
            const warningDiagnostics = slide.diagnostics.filter(
              (diagnostic) => diagnostic.severity === "warning",
            );
            const errorDiagnostics = slide.diagnostics.filter(
              (diagnostic) => diagnostic.severity === "error",
            );

            return (
              <div
                className="deck-slide-editor"
                data-active={isActive ? "true" : "false"}
                key={slide.id}
              >
                <div className="deck-slide-diagnostics">
                  {(warningDiagnostics.length > 0 ||
                    errorDiagnostics.length > 0) && (
                    <div className="relative flex justify-end gap-0.5">
                      {warningDiagnostics.length > 0 ? (
                        <Popover>
                          <PopoverTrigger asChild>
                            <button
                              aria-label={`Show warning diagnostics for slide ${index + 1}`}
                              className="deck-diagnostic-button deck-diagnostic-warning"
                              type="button"
                            >
                              <TriangleAlert className="size-3.5" />
                              <span>{warningDiagnostics.length}</span>
                            </button>
                          </PopoverTrigger>
                          <PopoverContent align="end" className="w-96">
                            <p className="mb-2 text-sm font-semibold">
                              Warnings
                            </p>
                            <ul className="space-y-1 text-xs leading-5">
                              {warningDiagnostics.map(
                                (diagnostic, diagnosticIndex) => (
                                  <li
                                    key={`warning-${slide.id}-${diagnosticIndex}`}
                                  >
                                    {diagnostic.message}
                                  </li>
                                ),
                              )}
                            </ul>
                          </PopoverContent>
                        </Popover>
                      ) : null}
                      {errorDiagnostics.length > 0 ? (
                        <Popover>
                          <PopoverTrigger asChild>
                            <button
                              aria-label={`Show error diagnostics for slide ${index + 1}`}
                              className="deck-diagnostic-button deck-diagnostic-error"
                              type="button"
                            >
                              <OctagonX className="size-3.5" />
                              <span>{errorDiagnostics.length}</span>
                            </button>
                          </PopoverTrigger>
                          <PopoverContent align="end" className="w-96">
                            <p className="mb-2 text-sm font-semibold">Errors</p>
                            <ul className="space-y-1 text-xs leading-5">
                              {errorDiagnostics.map(
                                (diagnostic, diagnosticIndex) => (
                                  <li
                                    key={`error-${slide.id}-${diagnosticIndex}`}
                                  >
                                    {diagnostic.message}
                                  </li>
                                ),
                              )}
                            </ul>
                          </PopoverContent>
                        </Popover>
                      ) : null}
                    </div>
                  )}
                </div>
                <textarea
                  aria-label={`Deck markdown for slide ${index + 1}`}
                  className="deck-slide-textarea block w-full border-0 bg-transparent px-3 py-2 font-mono text-xs leading-6 shadow-none focus-visible:outline-none"
                  data-active={isActive ? "true" : "false"}
                  onChange={(event) => {
                    resizeTextarea(event.target);
                    handleSlideChange(slide.id, event.target.value);
                    onSlideEdit?.(slide.id);
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
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
