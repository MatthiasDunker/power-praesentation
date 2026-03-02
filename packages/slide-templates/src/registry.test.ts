import { describe, expect, it } from "vitest";
import { decodeSlideTemplate } from "./decode-engine";
import { createCoreTemplateRegistry, createTemplateRegistry } from "./index";

describe("template registry", () => {
  it("includes all core templates", () => {
    const registry = createCoreTemplateRegistry();

    expect(Object.keys(registry)).toEqual([
      "title-hero",
      "section-divider",
      "bullet-list",
      "two-column",
      "multi-column",
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
          decoder: {
            kind: "custom",
            decode: () => ({ props: {}, diagnostics: [] })
          }
        }
      ],
      extensions: [
        {
          id: "custom-layout",
          containerRules: [],
          decoder: {
            kind: "custom",
            decode: () => ({ props: { from: "extension" }, diagnostics: [] })
          }
        }
      ]
    });

    const template = registry["custom-layout"];
    const decoded = template
      ? decodeSlideTemplate(template, {
          layout: "custom-layout",
          frontmatter: {},
          frontmatterData: {},
          bodyMarkdown: "",
          contentMarkdown: "",
          ast: { type: "root", children: [] },
          containers: []
        })
      : undefined;

    expect(decoded?.props).toEqual({ from: "extension" });
  });
});
