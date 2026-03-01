import { describe, expect, it } from "vitest";
import { decodeSlideTemplate } from "./decode-engine";
import { createCoreTemplateRegistry } from "./index";
import { parseMarkdownAst } from "./markdown-ast";

describe("two-column decoder", () => {
  it("warns when named columns are missing", () => {
    const registry = createCoreTemplateRegistry();
    const template = registry["two-column"];

    const contentMarkdown = "# Compare";
    const result = template
      ? decodeSlideTemplate(template, {
          layout: "two-column",
          frontmatter: {},
          frontmatterData: {},
          bodyMarkdown: "",
          contentMarkdown,
          ast: parseMarkdownAst(contentMarkdown),
          containers: []
        })
      : undefined;

    const messages = result?.diagnostics.map((diagnostic) => diagnostic.message).join(" ");
    expect(messages).toContain("expects 1 '::: leftColumn' containers, found 0");
    expect(messages).toContain("expects 1 '::: rightColumn' containers, found 0");
  });

  it("warns when extra named columns are provided", () => {
    const registry = createCoreTemplateRegistry();
    const template = registry["two-column"];

    const contentMarkdown = "# Compare";
    const result = template
      ? decodeSlideTemplate(template, {
          layout: "two-column",
          frontmatter: {},
          frontmatterData: {},
          bodyMarkdown: "",
          contentMarkdown,
          ast: parseMarkdownAst(contentMarkdown),
          containers: [
            {
              type: "fenced_container",
              kind: "leftColumn",
              markdown: "A",
              ast: { type: "root", children: [] },
              lineStart: 1,
              lineEnd: 1
            },
            {
              type: "fenced_container",
              kind: "leftColumn",
              markdown: "B",
              ast: { type: "root", children: [] },
              lineStart: 2,
              lineEnd: 2
            },
            {
              type: "fenced_container",
              kind: "rightColumn",
              markdown: "C",
              ast: { type: "root", children: [] },
              lineStart: 3,
              lineEnd: 3
            }
          ]
        })
      : undefined;

    const messages = result?.diagnostics.map((diagnostic) => diagnostic.message).join(" ");
    expect(messages).toContain("Extra leftColumns are ignored");
    expect(result?.props).toEqual({
      title: "Compare",
      leftColumn: "A",
      rightColumn: "C"
    });
  });

  it("decodes title, lead paragraphs, and named columns", () => {
    const registry = createCoreTemplateRegistry();
    const template = registry["two-column"];

    const bodyMarkdown = [
      "# Build vs Buy",
      "",
      "First lead paragraph.",
      "",
      "Second lead paragraph.",
      "",
      "::: leftColumn",
      "Left content",
      ":::",
      "",
      "::: rightColumn",
      "Right content",
      ":::"
    ].join("\n");
    const contentMarkdown = "# Build vs Buy\n\nFirst lead paragraph.\n\nSecond lead paragraph.";

    const result = template
      ? decodeSlideTemplate(template, {
          layout: "two-column",
          frontmatter: {},
          frontmatterData: {},
          bodyMarkdown,
          contentMarkdown,
          ast: parseMarkdownAst(contentMarkdown),
          containers: [
            {
              type: "fenced_container",
              kind: "leftColumn",
              markdown: "Left content",
              ast: { type: "root", children: [] },
              lineStart: 7,
              lineEnd: 9
            },
            {
              type: "fenced_container",
              kind: "rightColumn",
              markdown: "Right content",
              ast: { type: "root", children: [] },
              lineStart: 11,
              lineEnd: 13
            }
          ]
        })
      : undefined;

    expect(result?.diagnostics).toEqual([]);
    expect(result?.props).toEqual({
      title: "Build vs Buy",
      lead: "First lead paragraph.\n\nSecond lead paragraph.",
      leftColumn: "Left content",
      rightColumn: "Right content"
    });
  });
});
