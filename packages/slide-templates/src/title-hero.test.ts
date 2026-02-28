import { describe, expect, it } from "vitest";
import { decodeTitleHero } from "./templates/title-hero/decode";

describe("title-hero decoder", () => {
  it("extracts overline, title, and description from markdown", () => {
    const result = decodeTitleHero({
      layout: "title-hero",
      frontmatter: {},
      bodyMarkdown: "",
      contentMarkdown: "## Q4 Review\n# Product Direction\nA concise direction statement.",
      ast: { type: "root", children: [] },
      containers: []
    });

    expect(result.props).toEqual({
      overline: "Q4 Review",
      title: "Product Direction",
      description: "A concise direction statement."
    });
  });

  it("prefers frontmatter values when provided", () => {
    const result = decodeTitleHero({
      layout: "title-hero",
      frontmatter: {
        overline: "Board update",
        title: "Frontmatter title",
        description: "Frontmatter description"
      },
      bodyMarkdown: "",
      contentMarkdown: "# Markdown title\nMarkdown body",
      ast: { type: "root", children: [] },
      containers: []
    });

    expect(result.props).toEqual({
      overline: "Board update",
      title: "Markdown title",
      description: "Frontmatter description"
    });
  });
});
