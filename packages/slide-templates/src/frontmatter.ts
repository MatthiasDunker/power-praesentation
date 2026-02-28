import { parse as parseYaml, stringify as stringifyYaml } from "yaml";

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

export function toLines(input: string): string[] {
  return input.replace(/\r\n?/g, "\n").split("\n");
}

export function stripFrontmatter(markdown: string): string {
  if (!markdown.startsWith("---\n")) {
    return markdown;
  }

  const lines = toLines(markdown);
  const endIndex = lines.slice(1).findIndex((line) => line.trim() === "---");

  if (endIndex === -1) {
    return markdown;
  }

  return lines.slice(endIndex + 2).join("\n").trim();
}

export function parseFrontmatter(segment: string): {
  frontmatter: Record<string, string>;
  frontmatterData: Record<string, unknown>;
  bodyMarkdown: string;
} {
  if (!segment.startsWith("---\n")) {
    return {
      frontmatter: {},
      frontmatterData: {},
      bodyMarkdown: segment.trim()
    };
  }

  const lines = toLines(segment);
  if (lines.length < 3) {
    return {
      frontmatter: {},
      frontmatterData: {},
      bodyMarkdown: segment.trim()
    };
  }

  const endIndex = lines.slice(1).findIndex((line) => line.trim() === "---");
  if (endIndex === -1) {
    return {
      frontmatter: {},
      frontmatterData: {},
      bodyMarkdown: segment.trim()
    };
  }

  const frontmatterLines = lines.slice(1, endIndex + 1);
  const bodyLines = lines.slice(endIndex + 2);
  const rawFrontmatterText = frontmatterLines.join("\n");
  let parsedFrontmatter: unknown;

  try {
    parsedFrontmatter = parseYaml(rawFrontmatterText);
  } catch {
    parsedFrontmatter = {};
  }

  const frontmatterData = isRecord(parsedFrontmatter) ? parsedFrontmatter : {};
  const frontmatter: Record<string, string> = {};

  for (const [key, value] of Object.entries(frontmatterData)) {
    if (typeof value === "string") {
      frontmatter[key] = value;
      continue;
    }

    if (value === null) {
      frontmatter[key] = "";
      continue;
    }

    if (typeof value === "number" || typeof value === "boolean") {
      frontmatter[key] = String(value);
    }
  }

  return {
    frontmatter,
    frontmatterData,
    bodyMarkdown: bodyLines.join("\n").trim()
  };
}

export function stringifyFrontmatter(
  frontmatterData: Record<string, unknown>,
  layout: string
): string {
  const frontmatterWithLayout: Record<string, unknown> = {
    layout
  };

  for (const [key, value] of Object.entries(frontmatterData)) {
    if (key === "layout") {
      continue;
    }

    frontmatterWithLayout[key] = value;
  }

  return stringifyYaml(frontmatterWithLayout, {
    lineWidth: 0
  }).trim();
}
