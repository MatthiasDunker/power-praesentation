import { describe, expect, it } from "vitest";
import {
  parseDeckMarkdown,
  parseSingleSlideMarkdown,
  splitDeckMarkdownForEditing,
  splitDeckMarkdownForEditingDetailed,
  toSlideDocuments
} from "./markdown-parser";

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

  it("splits editor segments even when a fenced container is unclosed before separator", () => {
    const markdown = [
      "---\nlayout: two-column\n---\n# Compare\n\n::: leftColumn\nLeft side",
      "---\nlayout: title-hero\n---\n# Next\n\nText"
    ].join("\n\n---\n\n");

    const segments = splitDeckMarkdownForEditing(markdown);

    expect(segments).toHaveLength(2);
    expect(segments[0] ?? "").toContain("::: leftColumn");
    expect(segments[1] ?? "").toContain("layout: title-hero");
  });

  it("flags tolerant boundary recovery diagnostics for split editor segments", () => {
    const markdown = [
      "---\nlayout: two-column\n---\n# Compare\n\n::: leftColumn\nLeft side",
      "---\nlayout: title-hero\n---\n# Next\n\nText"
    ].join("\n\n---\n\n");

    const detailedSegments = splitDeckMarkdownForEditingDetailed(markdown);
    expect(detailedSegments).toHaveLength(2);

    const firstSegment = detailedSegments[0];
    const firstSlide = parseSingleSlideMarkdown(firstSegment?.markdown ?? "", {
      recoveredBoundary: firstSegment?.recoveredBoundary ?? false
    });

    expect(firstSegment?.recoveredBoundary).toBe(true);
    expect(firstSlide.diagnostics.map((diagnostic) => diagnostic.code)).toContain(
      "tolerant_boundary_recovery"
    );
  });

  it("round-trips canonical editor separators in edit splitting", () => {
    const markdown = [
      "---\nlayout: title-hero\n---\n# Intro",
      "---\nlayout: bullet-list\n---\n# Next\n\n- One"
    ].join("\n\n---\n\n");

    const segments = splitDeckMarkdownForEditing(markdown);

    expect(segments.join("\n\n---\n\n")).toBe(markdown);
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
    const parsed = parseDeckMarkdown(`---\nlayout: two-column\n---\n# Compare\n\n::: leftColumn\n- item one\n- item two\n:::\n\n::: rightColumn\n**bold**\n:::`);

    expect(parsed.slides[0].containers).toHaveLength(2);
    expect(parsed.slides[0].containers[0].markdown).toContain("- item one");
    expect(parsed.slides[0].diagnostics).toHaveLength(0);
  });

  it("warns when two-column has too many columns", () => {
    const parsed = parseDeckMarkdown(`---\nlayout: two-column\n---\n# Compare\n\n::: leftColumn\nA\n:::\n::: leftColumn\nB\n:::\n::: rightColumn\nC\n:::`);

    expect(parsed.slides[0].containers).toHaveLength(2);
    expect(parsed.slides[0].diagnostics.map((diagnostic) => diagnostic.message).join(" ")).toContain(
      "Extra leftColumns are ignored"
    );
  });

  it("ignores stray separator before frontmatter", () => {
    const parsed = parseDeckMarkdown(`---\n\n---\nlayout: title-hero\n---\n# Intro`);

    expect(parsed.slides).toHaveLength(1);
    expect(parsed.slides[0].layout).toBe("title-hero");
    expect(parsed.slides[0].title).toBe("Intro");
  });

  it("warns when nested fenced containers are used", () => {
    const parsed = parseDeckMarkdown(
      `---\nlayout: two-column\n---\n::: leftColumn\nOuter\n::: leftColumn\nInner\n:::\n:::`
    );

    expect(parsed.slides[0].diagnostics.map((diagnostic) => diagnostic.message).join(" ")).toContain(
      "Nested fenced containers are not supported in v1."
    );
  });

  it("warns when closing fenced container has no opening tag", () => {
    const parsed = parseDeckMarkdown(`---\nlayout: bullet-list\n---\n# Intro\n\n:::`);

    expect(parsed.slides[0].diagnostics.map((diagnostic) => diagnostic.message).join(" ")).toContain(
      "Found closing fenced container without opening tag."
    );
  });

  it("parses commonmark content without failing", () => {
    const parsed = parseDeckMarkdown(
      `---\nlayout: bullet-list\n---\n# Intro\n\n1. First\n2. Second\n\n> Quote\n\n\`\`\`ts\nconsole.log('x')\n\`\`\``
    );

    expect(parsed.slides[0].diagnostics).toHaveLength(0);
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

  it("keeps layout and footer payload when handlebar tokens are unquoted in lists", () => {
    const parsed = parseDeckMarkdown(
      `---
layout: title-hero
theme: sand
footer:
  cols:
    - First col 1
    - {{ page }}/{{pages}}
---
# Intro`
    );

    expect(parsed.slides[0].layout).toBe("title-hero");
    expect(parsed.slides[0].frontmatterData.footer).toEqual({
      cols: ["First col 1", "{{ page }}/{{pages}}"]
    });
  });

  it("normalizes blank footer cols to empty strings instead of null on refresh", () => {
    const parsed = parseDeckMarkdown(
      `---
layout: title-hero
theme: sand
footer:
  cols:
    - First col 1
    -  
    - "{{ page }}/{{pages}}"
---
# Intro`
    );

    expect(parsed.slides[0].layout).toBe("title-hero");
    expect(parsed.normalizedMarkdown).not.toContain("- null");
    expect(parsed.normalizedMarkdown).toContain('- ""');
  });

  it("keeps layout stable when trailing frontmatter lines are unfinished", () => {
    const parsed = parseDeckMarkdown(
      `---
layout: title-hero
theme: sand
footer:
  cols:
    - First col 1
-
    - {{ page }}/{{pages}}
---
# Intro`
    );

    expect(parsed.slides[0].layout).toBe("title-hero");
    expect(parsed.slides[0].frontmatterData.theme).toBe("sand");
    expect(parsed.slides[0].frontmatterData.footer).toEqual({
      cols: ["First col 1"]
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

  it("parses unquoted markdown link strings in footer columns", () => {
    const parsed = parseDeckMarkdown(
      `---
layout: title-hero
theme: sand
footer:
  cols:
    - Matthias Dunker
    - [www.interfacedivide.com](https://www.interfacedivide.com)
    - "{{ page }}/{{pages}}"
---
# Intro`
    );

    expect(parsed.slides[0].frontmatterData.footer).toEqual({
      cols: [
        "Matthias Dunker",
        "[www.interfacedivide.com](https://www.interfacedivide.com)",
        "{{ page }}/{{pages}}"
      ]
    });
  });
});
