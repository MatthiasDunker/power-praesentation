"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
const maxScale = 0.9;
const minScale = 0.05;

export function SlideCanvas({ slides, activeSlideId }: SlideCanvasProps) {
  const [scale, setScale] = useState(minScale);
  const [frameSize, setFrameSize] = useState({
    width: pageWidth * minScale,
    height: pageHeight * minScale,
  });
  const viewportRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const setResponsiveScale = () => {
      const viewportElement = viewportRef.current;

      if (!viewportElement) {
        return;
      }

      const { width, height } = viewportElement.getBoundingClientRect();
      const widthScale =
        width > 0 ? width / pageWidth : Number.POSITIVE_INFINITY;
      const heightScale =
        height > 0 ? height / pageHeight : Number.POSITIVE_INFINITY;
      const containScale = Math.min(maxScale, widthScale, heightScale);
      const nextScale =
        Number.isFinite(containScale) && containScale > 0
          ? Math.max(minScale, containScale)
          : minScale;
      const nextWidth = pageWidth * nextScale;
      const nextHeight = pageHeight * nextScale;

      setScale(nextScale);
      setFrameSize({ width: nextWidth, height: nextHeight });
    };

    const measureOnNextFrame = () => {
      if (typeof window === "undefined") {
        return;
      }

      window.requestAnimationFrame(setResponsiveScale);
    };

    measureOnNextFrame();
    const resizeObserver =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(setResponsiveScale)
        : null;
    const viewportElement = viewportRef.current;

    if (resizeObserver && viewportElement) {
      resizeObserver.observe(viewportElement);
    }

    window.addEventListener("resize", setResponsiveScale);

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener("resize", setResponsiveScale);
    };
  }, []);

  const activeSlideEntry = useMemo(() => {
    if (slides.length === 0) {
      return null;
    }

    if (!activeSlideId) {
      return {
        index: 0,
        slide: slides[0]
      };
    }

    const index = slides.findIndex((slide) => slide.id === activeSlideId);

    if (index >= 0) {
      return {
        index,
        slide: slides[index]
      };
    }

    return (
      slides[0]
        ? {
            index: 0,
            slide: slides[0]
          }
        : null
    );
  }, [activeSlideId, slides]);
  const activeSlide = activeSlideEntry?.slide ?? null;

  if (!activeSlide) {
    return (
      <Card
        className="grid min-h-[72vh] place-items-center p-6 text-sm text-zinc-600"
        data-testid="slide-canvas"
      >
        No slides yet.
      </Card>
    );
  }

  const liveStyle: CSSProperties = {
    transform: `scale(${scale})`,
    transformOrigin: "top left",
  };

  const printStyle: CSSProperties = {
    breakAfter: "page",
  };

  return (
    <section
      aria-label="Slide canvas"
      className="relative min-h-[72vh] min-w-0 overflow-hidden"
      data-testid="slide-canvas"
    >
      <div className="absolute inset-0 h-full min-w-0 overflow-hidden p-4 print:hidden">
        <div
          className="relative h-full w-full min-w-0 overflow-hidden"
          ref={viewportRef}
        >
          <div
            className="absolute left-1/2 top-1/2 overflow-hidden"
            style={{
              height: `${frameSize.height}px`,
              width: `${frameSize.width}px`,
              transform: "translate(-50%, -50%)",
            }}
          >
            <article
              className="absolute left-0 top-0 h-[1080px] w-[1920px] overflow-hidden border border-zinc-200 bg-white shadow-md"
              data-testid="live-slide-page"
              style={liveStyle}
            >
              <SlideRenderer
                slide={activeSlide}
                slideNumber={activeSlideEntry ? activeSlideEntry.index + 1 : undefined}
                slideCount={slides.length}
              />
            </article>
          </div>
        </div>
      </div>

      <div className="hidden print:block" data-testid="print-pages">
        {slides.map((slide, index) => (
          <article
            className="h-[1080px] w-[1920px] overflow-hidden bg-white"
            key={`print-${slide.id}`}
            style={printStyle}
          >
            <SlideRenderer
              slide={slide}
              slideNumber={index + 1}
              slideCount={slides.length}
            />
          </article>
        ))}
      </div>
    </section>
  );
}
