"use client";

import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import type { SlideDocument } from "@power/contracts";
import { SlideRenderer } from "@power/ui";
import { Card } from "@/components/ui/card";

interface SlideCanvasProps {
  slides: SlideDocument[];
  activeSlideId: string | null;
}

const pageWidth = 1920;
const pageHeight = 1080;

export function SlideCanvas({ slides, activeSlideId }: SlideCanvasProps) {
  const [scale, setScale] = useState(0.9);

  useEffect(() => {
    const setResponsiveScale = () => {
      const responsiveScale = Math.min(0.9, (window.innerWidth / pageWidth) * 0.9);
      setScale(responsiveScale);
    };

    setResponsiveScale();
    window.addEventListener("resize", setResponsiveScale);

    return () => {
      window.removeEventListener("resize", setResponsiveScale);
    };
  }, []);

  const activeSlide = useMemo(() => {
    if (!activeSlideId) {
      return slides[0] ?? null;
    }

    return slides.find((slide) => slide.id === activeSlideId) ?? slides[0] ?? null;
  }, [activeSlideId, slides]);

  if (!activeSlide) {
    return (
      <Card className="grid min-h-[72vh] place-items-center p-6 text-sm text-zinc-600" data-testid="slide-canvas">
        No slides yet.
      </Card>
    );
  }

  const liveStyle: CSSProperties = {
    transform: `scale(${scale})`,
    transformOrigin: "top center"
  };

  const printStyle: CSSProperties = {
    breakAfter: "page"
  };

  return (
    <section aria-label="Slide canvas" className="min-h-[72vh] overflow-auto" data-testid="slide-canvas">
      <Card className="grid justify-center overflow-auto p-4 print:hidden">
        <article
          className="relative h-[1080px] w-[1920px] overflow-hidden border border-zinc-200 bg-white shadow-sm"
          data-testid="live-slide-page"
          style={liveStyle}
        >
          <SlideRenderer slide={activeSlide} />
        </article>
      </Card>

      <div className="hidden print:block" data-testid="print-pages">
        {slides.map((slide) => (
          <article
            className="h-[1080px] w-[1920px] overflow-hidden bg-white"
            key={`print-${slide.id}`}
            style={printStyle}
          >
            <SlideRenderer slide={slide} />
          </article>
        ))}
      </div>
    </section>
  );
}
