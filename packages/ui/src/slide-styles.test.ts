import { describe, expect, it } from "vitest";
import { generateSlideCssFromHtml } from "./slide-styles";

describe("slide style generation", () => {
  it("generates css from html utility classes", async () => {
    const css = await generateSlideCssFromHtml(
      '<div class="text-red-500 p-4"></div>'
    );

    expect(css.length).toBeGreaterThan(0);
    expect(css).toContain("padding");
  });

  it("scopes css to slide roots by default", async () => {
    const css = await generateSlideCssFromHtml('<div class="text-red-500"></div>');

    expect(css).toContain("@scope ([data-power-slide-root])");
    expect(css).not.toContain(":root");
    expect(css).toContain(":scope");
  });

  it("supports opting out of scoping", async () => {
    const css = await generateSlideCssFromHtml('<div class="text-red-500"></div>', {
      scopeSelector: null,
    });

    expect(css).not.toContain("@scope (");
  });

  it("reuses cached css for the same cache key and html", async () => {
    const first = await generateSlideCssFromHtml(
      '<div class="text-red-500"></div>',
      "cache-test"
    );
    const second = await generateSlideCssFromHtml(
      '<div class="text-red-500"></div>',
      "cache-test"
    );

    expect(second).toBe(first);
  });

  it("regenerates css when html changes with the same cache key", async () => {
    const first = await generateSlideCssFromHtml(
      '<div class="text-red-500"></div>',
      "cache-test-html-change"
    );
    const second = await generateSlideCssFromHtml(
      '<div class="text-blue-500"></div>',
      "cache-test-html-change"
    );

    expect(second).not.toBe(first);
  });

  it("generates child-selector utility rules for list item spacing", async () => {
    const css = await generateSlideCssFromHtml(
      '<ul class="list-disc [&_>_li]:ml-[0.75em]"></ul>'
    );

    expect(css).toContain("margin-left:0.75em");
    expect(css).toMatch(/>\s*li\{margin-left:0\.75em;?\}/);
  });
});
