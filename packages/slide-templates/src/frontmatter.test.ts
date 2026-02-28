import { describe, expect, it } from "vitest";
import { parseFrontmatter, stringifyFrontmatter } from "./frontmatter";

describe("frontmatter parsing", () => {
  it("parses nested YAML while preserving scalar compatibility", () => {
    const parsed = parseFrontmatter(`---
layout: title-hero
theme: theme-sunrise
footer:
  cols:
    - "2026-02-28"
    - ""
    - "{{page}}/{{totalPages}}"
---
# Intro`);

    expect(parsed.frontmatter).toEqual({
      layout: "title-hero",
      theme: "theme-sunrise"
    });
    expect(parsed.frontmatterData).toEqual({
      layout: "title-hero",
      theme: "theme-sunrise",
      footer: {
        cols: ["2026-02-28", "", "{{page}}/{{totalPages}}"]
      }
    });
    expect(parsed.bodyMarkdown).toBe("# Intro");
  });

  it("stringifies nested YAML frontmatter and round-trips through parser", () => {
    const frontmatterData = {
      theme: "theme-sunrise",
      footer: {
        cols: ["A", "", "B"]
      }
    } as const;

    const serialized = stringifyFrontmatter(frontmatterData, "title-hero");
    const parsed = parseFrontmatter(`---\n${serialized}\n---\nBody`);

    expect(parsed.frontmatterData).toEqual({
      layout: "title-hero",
      theme: "theme-sunrise",
      footer: {
        cols: ["A", "", "B"]
      }
    });
  });
});
