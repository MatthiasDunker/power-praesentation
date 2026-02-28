import type { ReactElement } from "react";
import { describe, expect, it } from "vitest";
import { FooterPartial } from "./footer";
import { resolveTemplateSlots } from "./slots";

describe("resolveTemplateSlots", () => {
  it("creates a footer slot from plain frontmatter text", () => {
    const slots = resolveTemplateSlots({ frontmatter: { footer: "Acme 2026" } });
    const footer = slots.footer as ReactElement<{ value: unknown }> | undefined;

    expect(footer).toBeTruthy();
    expect(footer?.type).toBe(FooterPartial);
    expect(footer?.props.value).toBe("Acme 2026");
  });

  it("omits footer for off and none directives", () => {
    expect(resolveTemplateSlots({ frontmatter: { footer: "off" } }).footer).toBeUndefined();
    expect(resolveTemplateSlots({ frontmatter: { footer: "none" } }).footer).toBeUndefined();
  });

  it("omits footer for empty values", () => {
    expect(resolveTemplateSlots({ frontmatter: { footer: "" } }).footer).toBeUndefined();
    expect(resolveTemplateSlots({ frontmatter: { footer: "   " } }).footer).toBeUndefined();
  });

  it("supports structured footer props with columns and page tokens", () => {
    const slots = resolveTemplateSlots(
      {
        partials: {
          footer: {
            cols: ["2025-10-31", "", "Page {{page}}/{{totalPages}}"]
          }
        }
      },
      {
        slideNumber: 3,
        slideCount: 10
      }
    );
    const footer = slots.footer as ReactElement<{ value: unknown }> | undefined;

    expect(footer).toBeTruthy();
    expect(footer?.type).toBe(FooterPartial);
    expect(footer?.props.value).toEqual({
      cols: ["2025-10-31", "", "Page 3/10"]
    });
  });

  it("uses structured partials over scalar frontmatter when both exist", () => {
    const slots = resolveTemplateSlots({
      frontmatter: { footer: "scalar footer" },
      partials: {
        footer: {
          cols: ["A", "B"]
        }
      }
    });
    const footer = slots.footer as ReactElement<{ value: unknown }> | undefined;

    expect(footer?.props.value).toEqual({
      cols: ["A", "B"]
    });
  });
});
