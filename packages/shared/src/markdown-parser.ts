import type { SlideDocument, TemplateId } from "@power/contracts";

export interface ParsedSlide {
  id: string;
  layout: TemplateId;
  rawMarkdown: string;
  bodyMarkdown: string;
  title: string;
  frontmatter: Record<string, string>;
  containers: Array<{ kind: string; markdown: string }>;
  warnings: string[];
}

export interface ParsedDeck {
  slides: ParsedSlide[];
  normalizedMarkdown: string;
  warnings: string[];
}

const defaultLayout: TemplateId = "bullet-list";

function toLines(input: string): string[] {
  return input.replace(/\r\n?/g, "\n").split("\n");
}

function parseFrontmatter(segment: string): {
  frontmatter: Record<string, string>;
  body: string;
  rawFrontmatter: string;
} {
  if (!segment.startsWith("---\n")) {
    return { frontmatter: {}, body: segment, rawFrontmatter: "" };
  }

  const lines = toLines(segment);
  if (lines.length < 3) {
    return { frontmatter: {}, body: segment, rawFrontmatter: "" };
  }

  const endIndex = lines.slice(1).findIndex((line) => line.trim() === "---");
  if (endIndex === -1) {
    return { frontmatter: {}, body: segment, rawFrontmatter: "" };
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
    body: bodyLines.join("\n").trim(),
    rawFrontmatter: `---\n${frontmatterLines.join("\n")}\n---`
  };
}

function extractTopLevelSegments(input: string): string[] {
  const lines = toLines(input);
  const segments: string[] = [];
  let current: string[] = [];
  let insideContainer = false;
  let insideFrontmatter = false;

  const pushCurrent = () => {
    const text = current.join("\n").trim();
    if (text.length > 0) {
      segments.push(text);
    }
    current = [];
  };

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const trimmed = line.trim();
    const nextLine = lines[index + 1]?.trim() ?? "";
    const looksLikeFrontmatterStart = nextLine.includes(":");

    if (!insideContainer && trimmed === "---") {
      if (insideFrontmatter) {
        insideFrontmatter = false;
        current.push(line);
        continue;
      }

      if (current.length === 0) {
        if (looksLikeFrontmatterStart) {
          insideFrontmatter = true;
        }
        current.push(line);
        continue;
      }

      if (looksLikeFrontmatterStart) {
        pushCurrent();
        insideFrontmatter = true;
        current.push(line);
        continue;
      }

      pushCurrent();
      continue;
    }

    if (trimmed.startsWith(":::") && trimmed !== ":::") {
      if (!insideContainer) {
        insideContainer = true;
      }
    } else if (trimmed === ":::" && insideContainer) {
      insideContainer = false;
    }

    current.push(line);
  }

  pushCurrent();

  if (segments.length > 1) {
    return segments;
  }

  // Fallback mode: detect repeated frontmatter blocks as independent slides.
  const raw = input.replace(/\r\n?/g, "\n");
  const frontmatterSlideRegex = /(^|\n)(---\n[\s\S]*?\n---\n[\s\S]*?)(?=\n---\n|\n?$)/g;
  const matches = Array.from(raw.matchAll(frontmatterSlideRegex));
  if (matches.length >= 2) {
    return matches.map((match) => (match[2] ?? "").trim()).filter(Boolean);
  }

  return [raw.trim()].filter(Boolean);
}

function extractTitle(markdown: string): string {
  const lines = toLines(markdown);
  const heading = lines.find((line) => line.trim().startsWith("# "));
  if (heading) {
    return heading.trim().slice(2).trim();
  }

  const firstText = lines.find((line) => line.trim().length > 0);
  return firstText?.trim().slice(0, 80) ?? "Untitled slide";
}

function parseContainers(markdown: string): {
  containers: Array<{ kind: string; markdown: string }>;
  warnings: string[];
} {
  const lines = toLines(markdown);
  const containers: Array<{ kind: string; markdown: string }> = [];
  const warnings: string[] = [];

  let activeContainer: { kind: string; lines: string[] } | null = null;

  for (const line of lines) {
    const openMatch = line.match(/^:::\s*([a-zA-Z0-9_-]+)\s*$/);
    const isClose = line.trim() === ":::";

    if (openMatch) {
      if (activeContainer) {
        warnings.push("Nested fenced containers are not supported in v1.");
        activeContainer.lines.push(line);
        continue;
      }

      activeContainer = { kind: openMatch[1], lines: [] };
      continue;
    }

    if (isClose) {
      if (!activeContainer) {
        warnings.push("Found closing fenced container without opening tag.");
        continue;
      }

      containers.push({
        kind: activeContainer.kind,
        markdown: activeContainer.lines.join("\n").trim()
      });
      activeContainer = null;
      continue;
    }

    if (activeContainer) {
      activeContainer.lines.push(line);
    }
  }

  if (activeContainer) {
    warnings.push(`Unclosed fenced container '${activeContainer.kind}'.`);
    containers.push({
      kind: activeContainer.kind,
      markdown: activeContainer.lines.join("\n").trim()
    });
  }

  return { containers, warnings };
}

function isTemplateId(value: string): value is TemplateId {
  return (
    value === "title-hero" ||
    value === "section-divider" ||
    value === "bullet-list" ||
    value === "two-column" ||
    value === "quote-focus" ||
    value === "image-left-copy" ||
    value === "image-right-copy" ||
    value === "metric-highlight"
  );
}

function validateLayout(layout: TemplateId, containers: Array<{ kind: string; markdown: string }>): string[] {
  const warnings: string[] = [];

  if (layout === "two-column") {
    const columns = containers.filter((container) => container.kind === "column");

    if (columns.length === 0) {
      warnings.push("Layout 'two-column' expects 2 '::: column' containers, found 0.");
    }

    if (columns.length === 1) {
      warnings.push("Layout 'two-column' expects 2 '::: column' containers, found 1.");
    }

    if (columns.length > 2) {
      warnings.push("Layout 'two-column' received more than 2 columns. Extra columns are ignored.");
    }
  }

  return warnings;
}

function normalizeSlideMarkdown(slide: ParsedSlide): string {
  const frontmatterLines = [`layout: ${slide.layout}`];
  return `---\n${frontmatterLines.join("\n")}\n---\n${slide.bodyMarkdown}`.trim();
}

export function parseDeckMarkdown(input: string): ParsedDeck {
  const source = input.trim();
  if (!source) {
    return {
      slides: [],
      normalizedMarkdown: "",
      warnings: []
    };
  }

  const segments = extractTopLevelSegments(source);
  const deckWarnings: string[] = [];

  const slides = segments.map((segment, index) => {
    const { frontmatter, body } = parseFrontmatter(segment);
    const layout =
      typeof frontmatter.layout === "string" && isTemplateId(frontmatter.layout)
        ? frontmatter.layout
        : defaultLayout;

    const containerResult = parseContainers(body);
    const layoutWarnings = validateLayout(layout, containerResult.containers);
    const warnings = [...containerResult.warnings, ...layoutWarnings];

    if (warnings.length > 0) {
      deckWarnings.push(`Slide ${index + 1}: ${warnings.join(" ")}`);
    }

    return {
      id: `slide-${index + 1}`,
      layout,
      rawMarkdown: segment.trim(),
      bodyMarkdown: body,
      title: extractTitle(body),
      frontmatter,
      containers:
        layout === "two-column"
          ? containerResult.containers
              .filter((container) => container.kind === "column")
              .slice(0, 2)
          : containerResult.containers,
      warnings
    } satisfies ParsedSlide;
  });

  const normalizedMarkdown = slides.map((slide) => normalizeSlideMarkdown(slide)).join("\n\n---\n\n");

  return {
    slides,
    normalizedMarkdown,
    warnings: deckWarnings
  };
}

export function toSlideDocuments(parsedDeck: ParsedDeck): SlideDocument[] {
  return parsedDeck.slides.map((slide) => ({
    id: slide.id,
    layout: slide.layout,
    rawMarkdown: slide.rawMarkdown,
    containers: slide.containers,
    warnings: slide.warnings
  }));
}
