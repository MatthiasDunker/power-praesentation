import { describe, expect, it } from "vitest";
import { parseDeckMarkdown, toSlideDocuments } from "./markdown-parser";

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

  it("keeps non-layout frontmatter fields in normalized markdown", () => {
    const parsed = parseDeckMarkdown(
      `---\nlayout: title-hero\ntheme: theme-sunrise\noverline: Welcome\n---\n# Intro`,
    );

    expect(parsed.normalizedMarkdown).toContain("layout: title-hero");
    expect(parsed.normalizedMarkdown).toContain("theme: theme-sunrise");
    expect(parsed.normalizedMarkdown).toContain("overline: Welcome");
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

  it("inherits first-slide footer when later slides omit it", () => {
    const parsed = parseDeckMarkdown(
      `---\nlayout: title-hero\nfooter: Acme 2026\n---\n# Intro\n\n---\nlayout: bullet-list\n---\n# Detail`
    );

    expect(parsed.slides[0].resolvedFrontmatter.footer).toBe("Acme 2026");
    expect(parsed.slides[1].resolvedFrontmatter.footer).toBe("Acme 2026");
    expect(parsed.slides[1].resolvedPartials.footer).toBe("Acme 2026");
  });

  it("treats non-first explicit footer as slide-local override", () => {
    const parsed = parseDeckMarkdown(
      `---\nlayout: title-hero\nfooter: Acme 2026\n---\n# Intro\n\n---\nlayout: bullet-list\nfooter: Team B\n---\n# Detail\n\n---\nlayout: bullet-list\n---\n# Summary`
    );

    expect(parsed.slides[1].resolvedFrontmatter.footer).toBe("Team B");
    expect(parsed.slides[2].resolvedFrontmatter.footer).toBe("Acme 2026");
    expect(parsed.slides[1].resolvedPartials.footer).toBe("Team B");
  });

  it("disables inherited footer with footer: off on a slide", () => {
    const parsed = parseDeckMarkdown(
      `---\nlayout: title-hero\nfooter: Acme 2026\n---\n# Intro\n\n---\nlayout: bullet-list\nfooter: off\n---\n# Detail\n\n---\nlayout: bullet-list\n---\n# Summary`
    );

    expect(parsed.slides[1].resolvedFrontmatter.footer).toBeUndefined();
    expect(parsed.slides[2].resolvedFrontmatter.footer).toBe("Acme 2026");
    expect(parsed.slides[1].resolvedPartials.footer).toBeUndefined();
  });

  it("inherits from first slide when non-first footer is empty", () => {
    const parsed = parseDeckMarkdown(
      `---\nlayout: title-hero\nfooter: Acme 2026\n---\n# Intro\n\n---\nlayout: bullet-list\nfooter:\n---\n# Detail`
    );

    expect(parsed.slides[1].frontmatter.footer).toBe("");
    expect(parsed.slides[1].resolvedFrontmatter.footer).toBe("Acme 2026");
  });

  it("does not produce a default footer when first slide sets footer: off", () => {
    const parsed = parseDeckMarkdown(
      `---\nlayout: title-hero\nfooter: off\n---\n# Intro\n\n---\nlayout: bullet-list\n---\n# Detail`
    );

    expect(parsed.slides[0].resolvedFrontmatter.footer).toBeUndefined();
    expect(parsed.slides[1].resolvedFrontmatter.footer).toBeUndefined();
    expect(parsed.slides[1].resolvedPartials.footer).toBeUndefined();
  });

  it("inherits structured footer payloads from YAML", () => {
    const parsed = parseDeckMarkdown(
      `---
layout: title-hero
footer:
  cols:
    - "2026-02-28"
    - ""
    - "{{page}}/{{totalPages}}"
---
# Intro

---
layout: bullet-list
---
# Detail`
    );

    expect(parsed.slides[0].resolvedFrontmatter.footer).toBeUndefined();
    expect(parsed.slides[1].resolvedPartials.footer).toEqual({
      cols: ["2026-02-28", "", "{{page}}/{{totalPages}}"]
    });
  });

  it("includes resolved frontmatter in slide documents", () => {
    const parsed = parseDeckMarkdown(
      `---\nlayout: title-hero\nfooter: Acme 2026\n---\n# Intro\n\n---\nlayout: bullet-list\n---\n# Detail`
    );
    const documents = toSlideDocuments(parsed);

    expect(documents[1]?.resolvedFrontmatter?.footer).toBe("Acme 2026");
    expect(documents[0]?.resolvedFrontmatter?.footer).toBe("Acme 2026");
    expect(documents[0]?.resolvedPartials?.footer).toBe("Acme 2026");
  });

  it("keeps normalized markdown based on explicit frontmatter only", () => {
    const parsed = parseDeckMarkdown(
      `---
layout: title-hero
footer:
  cols:
    - "left"
    - ""
    - "right"
---
# Intro

---
layout: bullet-list
---
# Detail`
    );

    const footerMatches = parsed.normalizedMarkdown.match(/\nfooter:/g) ?? [];
    expect(footerMatches).toHaveLength(1);
  });
});
