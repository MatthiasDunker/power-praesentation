import { describe, expect, it } from "vitest";
import { parseMarkdownAst } from "./markdown-ast";
import { decodeTitleHero } from "./templates/title-hero/decode";

describe("title-hero decoder", () => {
  it("extracts overline, title, and description from markdown", () => {
    const contentMarkdown = "## Q4 Review\n# Product Direction\nA concise direction statement.";
    const result = decodeTitleHero({
      layout: "title-hero",
      frontmatter: {},
      frontmatterData: {},
      bodyMarkdown: "",
      contentMarkdown,
      ast: parseMarkdownAst(contentMarkdown),
      containers: []
    });

    expect(result.props).toEqual({
      overline: "Q4 Review",
      title: "Product Direction",
      text: "A concise direction statement.",
      className: "theme-default"
    });
  });

  it("prefers frontmatter values when provided", () => {
    const contentMarkdown = "# Markdown title\nMarkdown body";
    const result = decodeTitleHero({
      layout: "title-hero",
      frontmatter: {
        overline: "Board update",
        title: "Frontmatter title",
        text: "Frontmatter text",
        theme: "aurora"
      },
      frontmatterData: {},
      bodyMarkdown: "",
      contentMarkdown,
      ast: parseMarkdownAst(contentMarkdown),
      containers: []
    });

    expect(result.props).toEqual({
      overline: "Board update",
      title: "Markdown title",
      text: "Frontmatter text",
      className: "theme-aurora"
    });
  });
});
