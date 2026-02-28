import { describe, expect, it } from "vitest";
import { createSlideRendererRegistry } from "./slide-renderer";

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
});
