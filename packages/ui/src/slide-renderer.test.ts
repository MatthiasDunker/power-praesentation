import { describe, expect, it } from "vitest";
import type { SlideDocument } from "@power/contracts";
import type { ReactElement } from "react";
import { FooterPartial } from "@power/slide-templates/ui";
import { createSlideRendererRegistry } from "./slide-renderer";
import { SlideRenderer } from "./slide-renderer";

describe("slide renderer registry", () => {
  it("contains all core layouts", () => {
    const registry = createSlideRendererRegistry();

    expect(Object.keys(registry)).toEqual([
      "title-hero",
      "section-divider",
      "bullet-list",
      "two-column",
      "quote-focus",
      "image-left-copy",
      "image-right-copy",
      "metric-highlight"
    ]);
  });

  it("allows extension modules to override core entries", () => {
    const registry = createSlideRendererRegistry([
      {
        id: "bullet-list",
        containerRules: [],
        decode: () => ({ props: { markdown: "override" }, warnings: [] }),
        rootClassName: "override",
        render: () => null
      }
    ]);

    expect(registry["bullet-list"]?.rootClassName).toBe("override");
  });

  it("applies normalized theme class from frontmatter on slide root", () => {
    const slide: SlideDocument = {
      id: "slide-1",
      layout: "title-hero",
      rawMarkdown: `---
layout: title-hero
theme: beresa
---
# Hello`,
      containers: [],
      warnings: [],
    };

    const element = SlideRenderer({ slide }) as ReactElement<Record<string, unknown>>;

    expect(element.props["data-power-slide-root"]).toBe(true);
    expect(String(element.props.className)).toContain("theme-beresa");
  });

  it("keeps prefixed theme class from frontmatter", () => {
    const slide: SlideDocument = {
      id: "slide-1",
      layout: "title-hero",
      rawMarkdown: `---
layout: title-hero
theme: theme-esforin
---
# Hello`,
      containers: [],
      warnings: [],
    };

    const element = SlideRenderer({ slide }) as ReactElement<Record<string, unknown>>;

    expect(String(element.props.className)).toContain("theme-esforin");
    expect(String(element.props.className)).not.toContain("theme-theme-esforin");
  });

  it("passes footer slot from resolved frontmatter", () => {
    let capturedFooter: ReactElement<{ text: string }> | undefined;

    const registry = createSlideRendererRegistry([
      {
        id: "title-hero",
        containerRules: [],
        decode: () => ({ props: {}, warnings: [] }),
        rootClassName: "override",
        render: (_props, slots) => {
          capturedFooter = slots?.footer as ReactElement<{ text: string }> | undefined;
          return null;
        }
      }
    ]);

    const slide: SlideDocument = {
      id: "slide-1",
      layout: "title-hero",
      rawMarkdown: `---
layout: title-hero
---
# Hello`,
      resolvedFrontmatter: {
        layout: "title-hero",
        footer: "Acme 2026"
      },
      containers: [],
      warnings: []
    };

    SlideRenderer({ slide, registry });

    expect(capturedFooter).toBeTruthy();
    expect(capturedFooter?.type).toBe(FooterPartial);
    expect(capturedFooter?.props.text).toBe("Acme 2026");
  });

  it("does not pass footer slot when footer is disabled", () => {
    let capturedFooter: ReactElement<{ text: string }> | undefined;

    const registry = createSlideRendererRegistry([
      {
        id: "title-hero",
        containerRules: [],
        decode: () => ({ props: {}, warnings: [] }),
        rootClassName: "override",
        render: (_props, slots) => {
          capturedFooter = slots?.footer as ReactElement<{ text: string }> | undefined;
          return null;
        }
      }
    ]);

    const slide: SlideDocument = {
      id: "slide-1",
      layout: "title-hero",
      rawMarkdown: `---
layout: title-hero
footer: off
---
# Hello`,
      containers: [],
      warnings: []
    };

    SlideRenderer({ slide, registry });

    expect(capturedFooter).toBeUndefined();
  });
});
