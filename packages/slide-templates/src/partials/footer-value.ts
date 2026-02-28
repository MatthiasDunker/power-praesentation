export type FooterDirectiveType = "missing" | "inherit" | "disabled" | "value";

export interface FooterDirective {
  type: FooterDirectiveType;
  value?: string;
}

const footerDisableValues = new Set(["off", "none"]);

export function parseFooterDirective(input: string | undefined): FooterDirective {
  if (typeof input !== "string") {
    return { type: "missing" };
  }

  const trimmed = input.trim();
  if (trimmed.length === 0) {
    return { type: "inherit" };
  }

  if (footerDisableValues.has(trimmed.toLowerCase())) {
    return { type: "disabled" };
  }

  return {
    type: "value",
    value: trimmed
  };
}

export function resolveFooterValue(input: string | undefined): string | undefined {
  const parsed = parseFooterDirective(input);
  return parsed.type === "value" ? parsed.value : undefined;
}
