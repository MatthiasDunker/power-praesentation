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
  bodyMarkdown: string;
} {
  if (!segment.startsWith("---\n")) {
    return {
      frontmatter: {},
      bodyMarkdown: segment.trim()
    };
  }

  const lines = toLines(segment);
  if (lines.length < 3) {
    return {
      frontmatter: {},
      bodyMarkdown: segment.trim()
    };
  }

  const endIndex = lines.slice(1).findIndex((line) => line.trim() === "---");
  if (endIndex === -1) {
    return {
      frontmatter: {},
      bodyMarkdown: segment.trim()
    };
  }

  const frontmatterLines = lines.slice(1, endIndex + 1);
  const bodyLines = lines.slice(endIndex + 2);
  const frontmatter: Record<string, string> = {};

  for (const line of frontmatterLines) {
    const separator = line.indexOf(":");
    if (separator === -1) {
      continue;
    }

    const key = line.slice(0, separator).trim();
    const value = line.slice(separator + 1).trim();

    if (key.length > 0) {
      frontmatter[key] = value;
    }
  }

  return {
    frontmatter,
    bodyMarkdown: bodyLines.join("\n").trim()
  };
}
