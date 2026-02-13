"use client";

import type { SlideDocument } from "@power/contracts";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface SlideNavProps {
  slides: SlideDocument[];
  selectedSlideId: string | null;
  onSelectSlide: (slideId: string) => void;
}

function titleFromMarkdown(markdown: string): string {
  const withoutFrontmatter = markdown.startsWith("---\n")
    ? markdown.replace(/^---\n[\s\S]*?\n---\n?/, "")
    : markdown;
  const heading = withoutFrontmatter
    .split(/\r?\n/)
    .find((line) => line.trim().startsWith("# "))
    ?.trim()
    .slice(2);

  return heading ?? "Untitled";
}

export function SlideNav({ slides, selectedSlideId, onSelectSlide }: SlideNavProps) {
  return (
    <Card className="h-full max-h-[72vh] overflow-auto p-2 print:hidden md:max-h-none">
      <aside className="grid gap-2 md:grid-cols-1" data-testid="slide-nav">
        {slides.map((slide, index) => (
          <Button
            className={cn(
              "h-auto w-full flex-col items-start gap-1 px-3 py-2 text-left",
              slide.id === selectedSlideId ? "border-zinc-900 bg-zinc-900 text-white hover:bg-zinc-800" : ""
            )}
            key={slide.id}
            onClick={() => onSelectSlide(slide.id)}
            type="button"
            variant={slide.id === selectedSlideId ? "default" : "outline"}
          >
            <span className="text-xs opacity-80">Slide {index + 1}</span>
            <strong className="line-clamp-2 text-sm">{titleFromMarkdown(slide.rawMarkdown)}</strong>
            {slide.warnings.length > 0 ? <em className="text-xs not-italic">{slide.warnings.length} warnings</em> : null}
          </Button>
        ))}
      </aside>
    </Card>
  );
}
