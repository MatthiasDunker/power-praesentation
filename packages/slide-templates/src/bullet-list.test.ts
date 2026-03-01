import { describe, expect, it } from "vitest";
import { parseMarkdownAst } from "./markdown-ast";
import { decodeBulletList } from "./templates/bullet-list/decode";

describe("bullet-list decoder", () => {
  it("extracts title, subtitle, bullets, and notes from markdown AST", () => {
    const contentMarkdown = [
      "# Priorities",
      "## Q1",
      "",
      "- Ship baseline",
      "- Improve retention",
      "",
      "Focus on existing customers first."
    ].join("\n");

    const result = decodeBulletList({
      layout: "bullet-list",
      frontmatter: {},
      frontmatterData: {},
      bodyMarkdown: "",
      contentMarkdown,
      ast: parseMarkdownAst(contentMarkdown),
      containers: []
    });

    expect(result.props).toEqual({
      title: "Priorities",
      subtitle: "Q1",
      bullets: ["Ship baseline", "Improve retention"],
      notes: ["Focus on existing customers first."]
    });
  });
});
