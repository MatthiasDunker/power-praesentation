import { describe, expect, it } from "vitest";
import { decodeSlideTemplate } from "./decode-engine";
import { createCoreTemplateRegistry } from "./index";
import { parseMarkdownAst } from "./markdown-ast";

describe("multi-column decoder", () => {
  it("warns when no column containers are provided", () => {
    const registry = createCoreTemplateRegistry();
    const template = registry["multi-column"];

    const contentMarkdown = "# Compare";
    const result = template
      ? decodeSlideTemplate(template, {
          layout: "multi-column",
          frontmatter: {},
          frontmatterData: {},
          bodyMarkdown: "",
          contentMarkdown,
          ast: parseMarkdownAst(contentMarkdown),
          containers: []
        })
      : undefined;

    const messages = result?.diagnostics.map((diagnostic) => diagnostic.message).join(" ");
    expect(messages).toContain("expects at least 1 '::: column' containers, found 0");
  });

  it("decodes title, lead paragraphs, and repeated column containers", () => {
    const registry = createCoreTemplateRegistry();
    const template = registry["multi-column"];

    const bodyMarkdown = [
      "# Build vs Buy vs Hybrid vs Partner",
      "",
      "Four-way comparison framing sentence.",
      "",
      "Second lead paragraph.",
      "",
      "::: column",
      "Column A content",
      ":::",
      "",
      "::: column",
      "Column B content",
      ":::",
      "",
      "::: column",
      "Column C content",
      ":::",
      "",
      "::: column",
      "Column D content",
      ":::"
    ].join("\n");
    const contentMarkdown =
      "# Build vs Buy vs Hybrid vs Partner\n\nFour-way comparison framing sentence.\n\nSecond lead paragraph.";

    const result = template
      ? decodeSlideTemplate(template, {
          layout: "multi-column",
          frontmatter: {},
          frontmatterData: {},
          bodyMarkdown,
          contentMarkdown,
          ast: parseMarkdownAst(contentMarkdown),
          containers: [
            {
              type: "fenced_container",
              kind: "column",
              markdown: "Column A content",
              ast: { type: "root", children: [] },
              lineStart: 7,
              lineEnd: 9
            },
            {
              type: "fenced_container",
              kind: "column",
              markdown: "Column B content",
              ast: { type: "root", children: [] },
              lineStart: 11,
              lineEnd: 13
            },
            {
              type: "fenced_container",
              kind: "column",
              markdown: "Column C content",
              ast: { type: "root", children: [] },
              lineStart: 15,
              lineEnd: 17
            },
            {
              type: "fenced_container",
              kind: "column",
              markdown: "Column D content",
              ast: { type: "root", children: [] },
              lineStart: 19,
              lineEnd: 21
            }
          ]
        })
      : undefined;

    expect(result?.diagnostics).toEqual([]);
    expect(result?.props).toEqual({
      title: "Build vs Buy vs Hybrid vs Partner",
      lead: "Four-way comparison framing sentence.\n\nSecond lead paragraph.",
      columns: [
        "Column A content",
        "Column B content",
        "Column C content",
        "Column D content"
      ],
      className: "theme-default"
    });
  });
});
