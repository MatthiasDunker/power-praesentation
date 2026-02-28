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

  it("reuses cached css by cache key", async () => {
    const first = await generateSlideCssFromHtml(
      '<div class="text-red-500"></div>',
      "cache-test"
    );
    const second = await generateSlideCssFromHtml(
      '<div class="text-blue-500"></div>',
      "cache-test"
    );

    expect(second).toBe(first);
  });
});
