import { parse as parseYaml, stringify as stringifyYaml } from "yaml";

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function findInlineCommentStart(value: string): number {
  for (let index = 1; index < value.length; index += 1) {
    if (value[index] === "#" && /\s/.test(value[index - 1])) {
      return index;
    }
  }

  return -1;
}

function quoteHandlebarLeadingScalar(value: string): string {
  const leadingWhitespaceLength = value.length - value.trimStart().length;
  const leadingWhitespace = value.slice(0, leadingWhitespaceLength);
  const content = value.trimStart();

  if (content.length === 0) {
    return value;
  }

  if (
    content.startsWith("\"") ||
    content.startsWith("'") ||
    content.startsWith("|") ||
    content.startsWith(">")
  ) {
    return value;
  }

  if (!content.startsWith("{{")) {
    return value;
  }

  const commentStart = findInlineCommentStart(content);
  if (commentStart === -1) {
    return `${leadingWhitespace}${JSON.stringify(content)}`;
  }

  const scalar = content.slice(0, commentStart).trimEnd();
  const comment = content.slice(commentStart);
  return `${leadingWhitespace}${JSON.stringify(scalar)} ${comment}`;
}

function sanitizeHandlebarLeadingScalars(frontmatterText: string): string {
  const lines = toLines(frontmatterText);
  const nextLines = lines.map((line) => {
    const listItemMatch = line.match(/^(\s*-\s+)(.+)$/);
    if (listItemMatch) {
      const value = quoteHandlebarLeadingScalar(listItemMatch[2]);
      return `${listItemMatch[1]}${value}`;
    }

    const keyValueMatch = line.match(/^(\s*[^:#][^:]*:\s+)(.+)$/);
    if (keyValueMatch) {
      const value = quoteHandlebarLeadingScalar(keyValueMatch[2]);
      return `${keyValueMatch[1]}${value}`;
    }

    return line;
  });

  return nextLines.join("\n");
}

function tryParseYaml(text: string): unknown | undefined {
  try {
    return parseYaml(text);
  } catch {
    return undefined;
  }
}

function parseYamlDroppingBrokenSuffix(text: string): unknown | undefined {
  const lines = toLines(text);

  for (let end = lines.length - 1; end >= 1; end -= 1) {
    const candidate = lines.slice(0, end).join("\n").trimEnd();
    if (candidate.length === 0) {
      continue;
    }

    const parsed = tryParseYaml(candidate);
    if (typeof parsed !== "undefined") {
      return parsed;
    }
  }

  return undefined;
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
  let parsedFrontmatter: unknown | undefined = tryParseYaml(rawFrontmatterText);

  if (typeof parsedFrontmatter === "undefined") {
    const sanitizedText = sanitizeHandlebarLeadingScalars(rawFrontmatterText);
    parsedFrontmatter = tryParseYaml(sanitizedText);
    if (typeof parsedFrontmatter === "undefined") {
      parsedFrontmatter = parseYamlDroppingBrokenSuffix(sanitizedText);
    }
  }

  if (typeof parsedFrontmatter === "undefined") {
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

  const footer = frontmatterWithLayout.footer;
  if (isRecord(footer) && Array.isArray(footer.cols)) {
    frontmatterWithLayout.footer = {
      ...footer,
      cols: footer.cols.map((entry) => (entry === null ? "" : entry))
    };
  }

  return stringifyYaml(frontmatterWithLayout, {
    lineWidth: 0
  }).trim();
}
