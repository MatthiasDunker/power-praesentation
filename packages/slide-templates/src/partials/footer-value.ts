export type FooterDirectiveType = "missing" | "inherit" | "disabled" | "value";

export interface FooterDirective {
  type: FooterDirectiveType;
  value?: unknown;
}

export interface FooterRuntimeContext {
  slideNumber?: number;
  slideCount?: number;
}

const footerDisableValues = new Set(["off", "none"]);

export function parseFooterDirective(input: unknown): FooterDirective {
  if (typeof input === "undefined") {
    return { type: "missing" };
  }

  if (input === null) {
    return { type: "inherit" };
  }

  if (typeof input === "string") {
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

  return {
    type: "value",
    value: input
  };
}

export function resolveFooterValue(input: unknown): unknown {
  const parsed = parseFooterDirective(input);
  return parsed.type === "value" ? parsed.value : undefined;
}

function resolveFooterToken(
  token: string,
  context: FooterRuntimeContext
): string {
  const normalizedToken = token.toLowerCase();

  if (normalizedToken === "page" || normalizedToken === "pagenumber") {
    return context.slideNumber ? String(context.slideNumber) : "";
  }

  if (
    normalizedToken === "pages" ||
    normalizedToken === "totalpages" ||
    normalizedToken === "slidecount"
  ) {
    return context.slideCount ? String(context.slideCount) : "";
  }

  if (normalizedToken === "pagelabel") {
    if (context.slideNumber && context.slideCount) {
      return `${context.slideNumber}/${context.slideCount}`;
    }

    return context.slideNumber ? String(context.slideNumber) : "";
  }

  return "";
}

function applyFooterTokensToString(
  value: string,
  context: FooterRuntimeContext
): string {
  return value.replace(/\{\{\s*([a-zA-Z0-9_-]+)\s*\}\}/g, (_match, token) =>
    resolveFooterToken(token, context)
  );
}

function applyFooterTokens(value: unknown, context: FooterRuntimeContext): unknown {
  if (typeof value === "string") {
    return applyFooterTokensToString(value, context);
  }

  if (Array.isArray(value)) {
    return value.map((entry) => applyFooterTokens(entry, context));
  }

  if (value && typeof value === "object") {
    const source = value as Record<string, unknown>;
    const next: Record<string, unknown> = {};

    for (const [key, entry] of Object.entries(source)) {
      next[key] = applyFooterTokens(entry, context);
    }

    return next;
  }

  return value;
}

export function resolveFooterPayload(
  input: unknown,
  context: FooterRuntimeContext = {}
): unknown {
  const payload = resolveFooterValue(input);
  if (typeof payload === "undefined") {
    return undefined;
  }

  return applyFooterTokens(payload, context);
}
