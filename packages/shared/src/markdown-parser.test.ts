import { describe, expect, it } from "vitest";
import { parseDeckMarkdown } from "./markdown-parser";

describe("parseDeckMarkdown", () => {
  it("detects slides separated by ---", () => {
    const parsed = parseDeckMarkdown(`# Intro\n\nHello\n\n---\n\n# Next\n\nWorld`);

    expect(parsed.slides).toHaveLength(2);
    expect(parsed.slides[0].title).toBe("Intro");
    expect(parsed.slides[1].title).toBe("Next");
  });

  it("parses frontmatter-introduced slides", () => {
    const parsed = parseDeckMarkdown(`---\nlayout: title-hero\n---\n# Intro\n\n---\nlayout: quote-focus\n---\n# Quote`);

    expect(parsed.slides).toHaveLength(2);
    expect(parsed.slides[0].layout).toBe("title-hero");
    expect(parsed.slides[1].layout).toBe("quote-focus");
    expect(parsed.normalizedMarkdown).not.toContain("\n\n---\n\n---\nlayout:");
  });

  it("supports markdown syntax inside fenced containers", () => {
    const parsed = parseDeckMarkdown(`---\nlayout: two-column\n---\n# Compare\n\n::: column\n- item one\n- item two\n:::\n\n::: column\n**bold**\n:::`);

    expect(parsed.slides[0].containers).toHaveLength(2);
    expect(parsed.slides[0].containers[0].markdown).toContain("- item one");
    expect(parsed.slides[0].warnings).toHaveLength(0);
  });

  it("warns when two-column has too many columns", () => {
    const parsed = parseDeckMarkdown(`---\nlayout: two-column\n---\n# Compare\n\n::: column\nA\n:::\n::: column\nB\n:::\n::: column\nC\n:::`);

    expect(parsed.slides[0].containers).toHaveLength(2);
    expect(parsed.slides[0].warnings.join(" ")).toContain("Extra columns are ignored");
  });

  it("ignores stray separator before frontmatter", () => {
    const parsed = parseDeckMarkdown(`---\n\n---\nlayout: title-hero\n---\n# Intro`);

    expect(parsed.slides).toHaveLength(1);
    expect(parsed.slides[0].layout).toBe("title-hero");
    expect(parsed.slides[0].title).toBe("Intro");
  });

  it("warns when nested fenced containers are used", () => {
    const parsed = parseDeckMarkdown(
      `---\nlayout: two-column\n---\n::: column\nOuter\n::: column\nInner\n:::\n:::`
    );

    expect(parsed.slides[0].warnings.join(" ")).toContain(
      "Nested fenced containers are not supported in v1."
    );
  });

  it("warns when closing fenced container has no opening tag", () => {
    const parsed = parseDeckMarkdown(`---\nlayout: bullet-list\n---\n# Intro\n\n:::`);

    expect(parsed.slides[0].warnings.join(" ")).toContain(
      "Found closing fenced container without opening tag."
    );
  });

  it("parses commonmark content without failing", () => {
    const parsed = parseDeckMarkdown(
      `---\nlayout: bullet-list\n---\n# Intro\n\n1. First\n2. Second\n\n> Quote\n\n\`\`\`ts\nconsole.log('x')\n\`\`\``
    );

    expect(parsed.slides[0].warnings).toHaveLength(0);
    expect(parsed.slides[0].title).toBe("Intro");
  });
});
