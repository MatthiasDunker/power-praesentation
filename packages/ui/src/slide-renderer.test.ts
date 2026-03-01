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
        decoder: {
          kind: "custom",
          decode: () => ({ props: { markdown: "override" }, diagnostics: [] })
        },
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
      diagnostics: [],
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
      diagnostics: [],
    };

    const element = SlideRenderer({ slide }) as ReactElement<Record<string, unknown>>;

    expect(String(element.props.className)).toContain("theme-esforin");
    expect(String(element.props.className)).not.toContain("theme-theme-esforin");
  });

  it("passes footer slot from resolved frontmatter", () => {
    let capturedFooter: ReactElement<{ value: unknown }> | undefined;

    const registry = createSlideRendererRegistry([
      {
        id: "title-hero",
        containerRules: [],
        decoder: {
          kind: "custom",
          decode: () => ({ props: {}, diagnostics: [] })
        },
        rootClassName: "override",
        render: (_props, slots) => {
          capturedFooter = slots?.footer as ReactElement<{ value: unknown }> | undefined;
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
      resolvedPartials: {
        footer: "Acme 2026"
      },
      containers: [],
      diagnostics: []
    };

    SlideRenderer({ slide, registry });

    expect(capturedFooter).toBeTruthy();
    expect(capturedFooter?.type).toBe(FooterPartial);
    expect(capturedFooter?.props.value).toBe("Acme 2026");
  });

  it("does not pass footer slot when footer is disabled", () => {
    let capturedFooter: ReactElement<{ value: unknown }> | undefined;

    const registry = createSlideRendererRegistry([
      {
        id: "title-hero",
        containerRules: [],
        decoder: {
          kind: "custom",
          decode: () => ({ props: {}, diagnostics: [] })
        },
        rootClassName: "override",
        render: (_props, slots) => {
          capturedFooter = slots?.footer as ReactElement<{ value: unknown }> | undefined;
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
      diagnostics: []
    };

    SlideRenderer({ slide, registry });

    expect(capturedFooter).toBeUndefined();
  });

  it("resolves page tokens in structured footer props", () => {
    let capturedFooter: ReactElement<{ value: unknown }> | undefined;

    const registry = createSlideRendererRegistry([
      {
        id: "title-hero",
        containerRules: [],
        decoder: {
          kind: "custom",
          decode: () => ({ props: {}, diagnostics: [] })
        },
        rootClassName: "override",
        render: (_props, slots) => {
          capturedFooter = slots?.footer as ReactElement<{ value: unknown }> | undefined;
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
      resolvedPartials: {
        footer: {
          cols: ["2026-02-28", "", "{{page}}/{{totalPages}}"]
        }
      },
      containers: [],
      diagnostics: []
    };

    SlideRenderer({ slide, registry, slideNumber: 2, slideCount: 7 });

    expect(capturedFooter).toBeTruthy();
    expect(capturedFooter?.type).toBe(FooterPartial);
    expect(capturedFooter?.props.value).toEqual({
      cols: ["2026-02-28", "", "2/7"]
    });
  });

  it("renders an error placeholder when slide contains error diagnostics", () => {
    const slide: SlideDocument = {
      id: "slide-1",
      layout: "title-hero",
      rawMarkdown: `---
layout: title-hero
---
# Broken slide`,
      containers: [],
      diagnostics: [
        {
          severity: "error",
          message: "Layout 'title-hero' could not resolve required field 'title'."
        }
      ]
    };

    const element = SlideRenderer({ slide }) as ReactElement<Record<string, unknown>>;
    const serialized = JSON.stringify(element);

    expect(serialized).toContain("Unable to render:");
    expect(serialized).toContain("Broken slide");
    expect(serialized).toContain("could not resolve required field 'title'");
  });

  it("continues normal render when diagnostics contain warnings only", () => {
    const registry = createSlideRendererRegistry([
      {
        id: "title-hero",
        containerRules: [],
        decoder: {
          kind: "custom",
          decode: () => ({ props: {}, diagnostics: [] })
        },
        rootClassName: "override",
        render: () => "rendered-template"
      }
    ]);

    const slide: SlideDocument = {
      id: "slide-1",
      layout: "title-hero",
      rawMarkdown: `---
layout: title-hero
---
# Hello`,
      containers: [],
      diagnostics: [
        {
          severity: "warning",
          message: "Layout 'title-hero' could not resolve required field 'text'."
        }
      ]
    };

    const element = SlideRenderer({ slide, registry }) as ReactElement<Record<string, unknown>>;
    const serialized = JSON.stringify(element);

    expect(serialized).toContain("rendered-template");
    expect(serialized).not.toContain("Unable to render");
  });
});
