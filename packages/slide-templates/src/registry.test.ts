import { describe, expect, it } from "vitest";
import { createCoreTemplateRegistry, createTemplateRegistry } from "./index";

describe("template registry", () => {
  it("includes all core templates", () => {
    const registry = createCoreTemplateRegistry();

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

  it("allows extension templates to override by id", () => {
    const registry = createTemplateRegistry({
      core: [
        {
          id: "custom-layout",
          containerRules: [],
          decode: () => ({ props: {}, warnings: [] })
        }
      ],
      extensions: [
        {
          id: "custom-layout",
          containerRules: [],
          decode: () => ({ props: { from: "extension" }, warnings: [] })
        }
      ]
    });

    const decoded = registry["custom-layout"]?.decode({
      layout: "custom-layout",
      frontmatter: {},
      bodyMarkdown: "",
      contentMarkdown: "",
      ast: { type: "root", children: [] },
      containers: []
    });

    expect(decoded?.props).toEqual({ from: "extension" });
  });
});
