import type { ReactElement } from "react";
import { describe, expect, it } from "vitest";
import { FooterPartial } from "./footer";
import { resolveTemplateSlots } from "./slots";

describe("resolveTemplateSlots", () => {
  it("creates a footer slot from plain frontmatter text", () => {
    const slots = resolveTemplateSlots({ footer: "Acme 2026" });
    const footer = slots.footer as ReactElement<{ text: string }> | undefined;

    expect(footer).toBeTruthy();
    expect(footer?.type).toBe(FooterPartial);
    expect(footer?.props.text).toBe("Acme 2026");
  });

  it("omits footer for off and none directives", () => {
    expect(resolveTemplateSlots({ footer: "off" }).footer).toBeUndefined();
    expect(resolveTemplateSlots({ footer: "none" }).footer).toBeUndefined();
  });

  it("omits footer for empty values", () => {
    expect(resolveTemplateSlots({ footer: "" }).footer).toBeUndefined();
    expect(resolveTemplateSlots({ footer: "   " }).footer).toBeUndefined();
  });
});
