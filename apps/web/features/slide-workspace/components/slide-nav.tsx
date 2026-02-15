"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { SlideDocument } from "@power/contracts";
import { SlideRenderer } from "@power/ui";
import { toPng } from "html-to-image";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const thumbnailDisplayWidth = 176;
const thumbnailDisplayHeight = 99;
const thumbnailBitmapWidth = 352;
const thumbnailBitmapHeight = 198;
const slideWidth = 1920;
const slideHeight = 1080;
const navSelectionSwapDebounceMs = 250;

export interface SlideThumbnailLiveSignal {
  slideId: string;
  source: "select" | "edit";
  nonce: number;
}

export interface SlideSelectionSignal {
  slideId: string;
  source: "nav" | "markdown";
  nonce: number;
}

interface SlideNavProps {
  slides: SlideDocument[];
  selectedSlideId: string | null;
  selectionSignal: SlideSelectionSignal | null;
  liveSignal: SlideThumbnailLiveSignal | null;
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

function createFingerprint(slide: SlideDocument): string {
  return JSON.stringify({
    layout: slide.layout,
    rawMarkdown: slide.rawMarkdown,
    containers: slide.containers,
    warnings: slide.warnings
  });
}

export function SlideNav({
  slides,
  selectedSlideId,
  selectionSignal,
  liveSignal,
  onSelectSlide
}: SlideNavProps) {
  const [bitmapBySlideId, setBitmapBySlideId] = useState<Record<string, string>>({});
  const [liveSlideId, setLiveSlideId] = useState<string | null>(null);
  const [captureSlideId, setCaptureSlideId] = useState<string | null>(null);

  const captureNodeRef = useRef<HTMLDivElement | null>(null);
  const captureSlideIdRef = useRef<string | null>(null);
  const selectedSlideIdRef = useRef<string | null>(null);
  const activeLiveSlideIdRef = useRef<string | null>(null);
  const navSelectionSwapTimerRef = useRef<number | null>(null);
  const slidesByIdRef = useRef<Map<string, SlideDocument>>(new Map());
  const knownFingerprintBySlideIdRef = useRef<Map<string, string>>(new Map());
  const captureQueueRef = useRef<string[]>([]);
  const queuedCaptureRef = useRef<Set<string>>(new Set());
  const isCaptureProcessingRef = useRef(false);

  const slidesById = useMemo(() => new Map(slides.map((slide) => [slide.id, slide])), [slides]);
  const fingerprintBySlideId = useMemo(
    () => new Map(slides.map((slide) => [slide.id, createFingerprint(slide)])),
    [slides]
  );
  const captureSlide = captureSlideId ? slidesById.get(captureSlideId) ?? null : null;

  useEffect(() => {
    slidesByIdRef.current = slidesById;
  }, [slidesById]);

  useEffect(() => {
    captureSlideIdRef.current = captureSlideId;
  }, [captureSlideId]);

  useEffect(() => {
    selectedSlideIdRef.current = selectedSlideId;
  }, [selectedSlideId]);

  const clearNavSelectionSwapTimer = useCallback(() => {
    if (navSelectionSwapTimerRef.current !== null) {
      window.clearTimeout(navSelectionSwapTimerRef.current);
      navSelectionSwapTimerRef.current = null;
    }
  }, []);

  const drainCaptureQueue = useCallback(() => {
    if (isCaptureProcessingRef.current) {
      return;
    }

    while (captureQueueRef.current.length > 0) {
      const nextSlideId = captureQueueRef.current.shift();
      if (!nextSlideId) {
        continue;
      }

      queuedCaptureRef.current.delete(nextSlideId);
      if (!slidesByIdRef.current.has(nextSlideId)) {
        continue;
      }

      isCaptureProcessingRef.current = true;
      setCaptureSlideId(nextSlideId);
      return;
    }
  }, []);

  const enqueueCapture = useCallback(
    (slideId: string) => {
      if (!slidesByIdRef.current.has(slideId)) {
        return;
      }

      if (captureSlideIdRef.current === slideId || queuedCaptureRef.current.has(slideId)) {
        return;
      }

      captureQueueRef.current.push(slideId);
      queuedCaptureRef.current.add(slideId);
      drainCaptureQueue();
    },
    [drainCaptureQueue]
  );

  const activateLiveSlide = useCallback(
    (slideId: string) => {
      if (!slidesByIdRef.current.has(slideId)) {
        return;
      }

      clearNavSelectionSwapTimer();

      const previousLiveSlideId = activeLiveSlideIdRef.current;
      if (previousLiveSlideId && previousLiveSlideId !== slideId) {
        enqueueCapture(previousLiveSlideId);
      }

      activeLiveSlideIdRef.current = slideId;
      setLiveSlideId(slideId);
    },
    [clearNavSelectionSwapTimer, enqueueCapture]
  );

  useEffect(() => {
    if (!liveSignal) {
      return;
    }

    activateLiveSlide(liveSignal.slideId);
  }, [activateLiveSlide, liveSignal]);

  useEffect(() => {
    if (!selectionSignal || selectionSignal.source !== "nav") {
      return;
    }

    const currentLiveSlideId = activeLiveSlideIdRef.current;
    if (!currentLiveSlideId || currentLiveSlideId === selectionSignal.slideId) {
      clearNavSelectionSwapTimer();
      return;
    }

    clearNavSelectionSwapTimer();
    navSelectionSwapTimerRef.current = window.setTimeout(() => {
      navSelectionSwapTimerRef.current = null;

      const liveSlideAtTimeout = activeLiveSlideIdRef.current;
      if (!liveSlideAtTimeout || liveSlideAtTimeout === selectedSlideIdRef.current) {
        return;
      }

      enqueueCapture(liveSlideAtTimeout);
      activeLiveSlideIdRef.current = null;
      setLiveSlideId(null);
    }, navSelectionSwapDebounceMs);
  }, [clearNavSelectionSwapTimer, enqueueCapture, selectionSignal]);

  useEffect(() => {
    const slideIds = new Set(slides.map((slide) => slide.id));
    const removedSlideIds: string[] = [];

    for (const knownSlideId of knownFingerprintBySlideIdRef.current.keys()) {
      if (!slideIds.has(knownSlideId)) {
        removedSlideIds.push(knownSlideId);
      }
    }

    for (const removedSlideId of removedSlideIds) {
      knownFingerprintBySlideIdRef.current.delete(removedSlideId);
    }

    if (removedSlideIds.length > 0) {
      setBitmapBySlideId((current) => {
        const next = { ...current };
        for (const removedSlideId of removedSlideIds) {
          delete next[removedSlideId];
        }
        return next;
      });
    }

    if (activeLiveSlideIdRef.current && !slideIds.has(activeLiveSlideIdRef.current)) {
      activeLiveSlideIdRef.current = null;
      setLiveSlideId(null);
    }

    for (const slide of slides) {
      const previousFingerprint = knownFingerprintBySlideIdRef.current.get(slide.id);
      const nextFingerprint = fingerprintBySlideId.get(slide.id) ?? "";
      const hasChanged = previousFingerprint !== nextFingerprint;
      knownFingerprintBySlideIdRef.current.set(slide.id, nextFingerprint);

      if (slide.id === activeLiveSlideIdRef.current) {
        continue;
      }

      if (hasChanged || !bitmapBySlideId[slide.id]) {
        enqueueCapture(slide.id);
      }
    }

    captureQueueRef.current = captureQueueRef.current.filter((slideId) => slideIds.has(slideId));
    queuedCaptureRef.current = new Set(captureQueueRef.current);
  }, [bitmapBySlideId, enqueueCapture, fingerprintBySlideId, slides]);

  useEffect(() => {
    if (!captureSlideId) {
      return;
    }

    let cancelled = false;
    const currentCaptureSlideId = captureSlideId;

    const capture = async () => {
      const waitForPaint = () =>
        new Promise<void>((resolve) => {
          window.requestAnimationFrame(() => window.requestAnimationFrame(() => resolve()));
        });

      try {
        await waitForPaint();
        const captureNode = captureNodeRef.current;
        if (!captureNode || !slidesByIdRef.current.has(currentCaptureSlideId)) {
          return;
        }

        const dataUrl = await toPng(captureNode, {
          width: thumbnailDisplayWidth,
          height: thumbnailDisplayHeight,
          canvasWidth: thumbnailBitmapWidth,
          canvasHeight: thumbnailBitmapHeight,
          pixelRatio: 1,
          backgroundColor: "#ffffff"
        });

        if (cancelled) {
          return;
        }

        setBitmapBySlideId((current) => ({
          ...current,
          [currentCaptureSlideId]: dataUrl
        }));
      } catch (error) {
        console.warn("Thumbnail capture failed", error);
      } finally {
        if (!cancelled) {
          isCaptureProcessingRef.current = false;
          setCaptureSlideId(null);
          drainCaptureQueue();
        }
      }
    };

    capture();

    return () => {
      cancelled = true;
    };
  }, [captureSlideId, drainCaptureQueue]);

  useEffect(() => {
    return () => {
      clearNavSelectionSwapTimer();
      captureQueueRef.current = [];
      queuedCaptureRef.current.clear();
    };
  }, [clearNavSelectionSwapTimer]);

  return (
    <>
      <Card className="h-full max-h-[72vh] overflow-auto p-2 print:hidden md:max-h-none">
        <aside className="grid gap-2 md:grid-cols-1" data-testid="slide-nav">
          {slides.map((slide, index) => {
            const bitmap = bitmapBySlideId[slide.id];
            const isLive = liveSlideId === slide.id;
            const mode = isLive ? "live" : bitmap ? "bitmap" : "pending";
            const isSelected = slide.id === selectedSlideId;
            const selectedButtonStyle = isSelected
              ? {
                  backgroundColor: "Highlight",
                  color: "HighlightText",
                  borderColor: "Highlight"
                }
              : undefined;

            return (
              <Button
                className={cn(
                  "h-auto w-full flex-col items-start gap-2 border-0 px-3 py-2 text-left shadow-none",
                  isSelected ? "bg-zinc-900 text-white hover:bg-zinc-800" : ""
                )}
                key={slide.id}
                onClick={() => onSelectSlide(slide.id)}
                type="button"
                variant={isSelected ? "default" : "outline"}
                style={selectedButtonStyle}
              >
                <span
                  aria-hidden
                  className={cn(
                    "relative h-[99px] w-[176px] overflow-hidden rounded-sm border",
                    isSelected ? "border-zinc-700 bg-zinc-800/80 text-zinc-200" : "border-zinc-200 bg-zinc-50 text-zinc-500"
                  )}
                  data-testid={`slide-thumbnail-${slide.id}`}
                  data-thumbnail-mode={mode}
                >
                  {mode === "live" ? (
                    <article
                      className="absolute left-0 top-0 h-[1080px] w-[1920px] origin-top-left overflow-hidden bg-white text-zinc-900"
                      style={{
                        transform: `scale(${thumbnailDisplayWidth / slideWidth})`,
                        transformOrigin: "top left"
                      }}
                    >
                      <SlideRenderer slide={slide} />
                    </article>
                  ) : null}
                  {mode === "bitmap" && bitmap ? (
                    <img
                      alt={`Slide ${index + 1} thumbnail`}
                      className="h-full w-full object-cover"
                      src={bitmap}
                    />
                  ) : null}
                  {mode === "pending" ? (
                    <span className="grid h-full w-full place-items-center text-[11px] font-medium uppercase tracking-wide">
                      loading
                    </span>
                  ) : null}
                </span>
                <span className="flex w-full flex-col gap-0.5">
                  <span className="text-xs opacity-80">Slide {index + 1}</span>
                  <span className="block w-full truncate text-xs">
                    {titleFromMarkdown(slide.rawMarkdown)}
                  </span>
                  {slide.warnings.length > 0 ? (
                    <em className="text-xs not-italic">{slide.warnings.length} warnings</em>
                  ) : null}
                </span>
              </Button>
            );
          })}
        </aside>
      </Card>

      <div
        className="pointer-events-none fixed left-[-9999px] top-0 overflow-hidden opacity-0"
        style={{ height: thumbnailDisplayHeight, width: thumbnailDisplayWidth }}
      >
        <div
          className="relative overflow-hidden bg-white"
          ref={captureNodeRef}
          style={{ height: thumbnailDisplayHeight, width: thumbnailDisplayWidth }}
        >
          {captureSlide ? (
            <article
              className="absolute left-0 top-0 origin-top-left overflow-hidden bg-white text-zinc-900"
              style={{
                height: slideHeight,
                width: slideWidth,
                transform: `scale(${thumbnailDisplayWidth / slideWidth})`,
                transformOrigin: "top left"
              }}
            >
              <SlideRenderer slide={captureSlide} />
            </article>
          ) : null}
        </div>
      </div>
    </>
  );
}
