import type { SlideDiagnostic, SlideDocument, SlideLayoutId } from "@power/contracts";
import {
  createCoreTemplateRegistry,
  createSlideAstInputFromMarkdown,
  decodeSlideTemplate,
  parseFooterDirective,
  parseFrontmatter,
  stringifyFrontmatter,
  toLines,
  type SlideAstContainerNode,
  type SlideTemplateRegistry
} from "@power/slide-templates";

export interface ParsedSlide {
  id: string;
  layout: SlideLayoutId;
  rawMarkdown: string;
  bodyMarkdown: string;
  title: string;
  frontmatter: Record<string, string>;
  frontmatterData: Record<string, unknown>;
  resolvedFrontmatter: Record<string, string>;
  resolvedPartials: Record<string, unknown>;
  containers: Array<{ kind: string; markdown: string }>;
  diagnostics: SlideDiagnostic[];
}

export interface ParsedDeck {
  slides: ParsedSlide[];
  normalizedMarkdown: string;
  diagnostics: SlideDiagnostic[];
}

export interface ParseDeckMarkdownOptions {
  templateRegistry?: SlideTemplateRegistry;
}

export interface EditableSlideSegment {
  markdown: string;
  recoveredBoundary: boolean;
}

export interface ParseSingleSlideMarkdownOptions extends ParseDeckMarkdownOptions {
  id?: string;
  recoveredBoundary?: boolean;
}

export interface ParseSingleSlideMarkdownResult {
  slide: ParsedSlide | null;
  diagnostics: SlideDiagnostic[];
}

const defaultLayout: SlideLayoutId = "bullet-list";
const fallbackLayout: SlideLayoutId = "bullet-list";
const defaultTemplateRegistry = createCoreTemplateRegistry();
const canonicalEditorSeparator = "\n\n---\n\n";
const tolerantBoundaryRecoveryMessage =
  "Recovered slide boundary at '---' while fenced container was still open.";

interface ParsedDeckSegment {
  segment: string;
  parsedFrontmatter: ReturnType<typeof parseFrontmatter>;
}

function isContainerOpenLine(trimmedLine: string): boolean {
  return /^:::\s*[a-zA-Z0-9_-]+\s*$/.test(trimmedLine);
}

function isContainerCloseLine(trimmedLine: string): boolean {
  return trimmedLine === ":::";
}

function hasUnclosedFencedContainer(markdown: string): boolean {
  const lines = toLines(markdown);
  let depth = 0;

  for (const line of lines) {
    const trimmed = line.trim();

    if (isContainerOpenLine(trimmed)) {
      depth += 1;
      continue;
    }

    if (isContainerCloseLine(trimmed) && depth > 0) {
      depth -= 1;
    }
  }

  return depth > 0;
}

function splitDeckMarkdownForEditingFallback(markdown: string): EditableSlideSegment[] {
  const lines = toLines(markdown);
  const segments: EditableSlideSegment[] = [];
  let currentLines: string[] = [];
  let insideFrontmatter = false;
  let containerDepth = 0;

  const pushCurrent = () => {
    const text = currentLines.join("\n");
    if (text.trim().length > 0 && text.trim() !== "---") {
      segments.push({
        markdown: text,
        recoveredBoundary: false
      });
    }
    currentLines = [];
    containerDepth = 0;
  };

  const markBoundaryRecovery = () => {
    if (segments.length === 0 && currentLines.length === 0) {
      return;
    }

    if (containerDepth <= 0) {
      return;
    }

    if (segments.length > 0 && currentLines.length === 0) {
      segments[segments.length - 1].recoveredBoundary = true;
      return;
    }

    const segmentMarkdown = currentLines.join("\n");
    if (segmentMarkdown.trim().length === 0 || segmentMarkdown.trim() === "---") {
      return;
    }

    segments.push({
      markdown: segmentMarkdown,
      recoveredBoundary: true
    });
    currentLines = [];
    containerDepth = 0;
  };

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const trimmed = line.trim();
    const nextLine = lines[index + 1]?.trim() ?? "";
    const looksLikeFrontmatterStart = nextLine.includes(":");

    if (trimmed === "---") {
      if (insideFrontmatter) {
        insideFrontmatter = false;
        currentLines.push(line);
        continue;
      }

      if (currentLines.length === 0) {
        if (looksLikeFrontmatterStart) {
          insideFrontmatter = true;
          currentLines.push(line);
        }
        continue;
      }

      if (looksLikeFrontmatterStart) {
        if (containerDepth > 0) {
          markBoundaryRecovery();
        } else {
          pushCurrent();
        }
        insideFrontmatter = true;
        currentLines.push(line);
        continue;
      }

      if (containerDepth > 0) {
        markBoundaryRecovery();
      } else {
        pushCurrent();
      }
      continue;
    }

    if (!insideFrontmatter) {
      if (isContainerOpenLine(trimmed)) {
        containerDepth += 1;
      } else if (isContainerCloseLine(trimmed) && containerDepth > 0) {
        containerDepth -= 1;
      }
    }

    currentLines.push(line);
  }

  pushCurrent();
  return segments;
}

export function splitDeckMarkdownForEditingDetailed(markdown: string): EditableSlideSegment[] {
  if (!markdown.trim()) {
    return [];
  }

  if (markdown.includes(canonicalEditorSeparator)) {
    const segments = markdown.split(canonicalEditorSeparator);
    return segments.map((segment, index) => ({
      markdown: segment,
      recoveredBoundary:
        index < segments.length - 1 && hasUnclosedFencedContainer(segment)
    }));
  }

  return splitDeckMarkdownForEditingFallback(markdown);
}

export function splitDeckMarkdownForEditing(markdown: string): string[] {
  return splitDeckMarkdownForEditingDetailed(markdown).map(
    (segment) => segment.markdown
  );
}

function extractTopLevelSegments(input: string): string[] {
  const lines = toLines(input);
  const segments: string[] = [];
  let current: string[] = [];
  let insideContainer = false;
  let insideFrontmatter = false;

  const pushCurrent = () => {
    const text = current.join("\n").trim();
    if (text.length > 0 && text !== "---") {
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
          current.push(line);
        }
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

  if (segments.length === 1) {
    return segments;
  }

  const raw = input.replace(/\r\n?/g, "\n");
  const frontmatterSlideRegex =
    /(^|\n)(---\n[\s\S]*?\n---\n[\s\S]*?)(?=\n---\n|\n?$)/g;
  const matches = Array.from(raw.matchAll(frontmatterSlideRegex));
  if (matches.length >= 2) {
    return matches
      .map((match) => (match[2] ?? "").trim())
      .filter(Boolean);
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

function normalizeContainersForTemplate(
  containers: SlideAstContainerNode[],
  registryEntry: SlideTemplateRegistry[string] | undefined
): Array<{ kind: string; markdown: string }> {
  if (!registryEntry || registryEntry.containerRules.length === 0) {
    return containers.map((container) => ({
      kind: container.kind,
      markdown: container.markdown
    }));
  }

  const normalized: Array<{ kind: string; markdown: string }> = [];

  for (const rule of registryEntry.containerRules) {
    const matching = containers
      .filter((container) => container.kind === rule.kind)
      .slice(0, rule.max);

    for (const container of matching) {
      normalized.push({
        kind: container.kind,
        markdown: container.markdown
      });
    }
  }

  return normalized;
}

function normalizeSlideMarkdown(slide: ParsedSlide): string {
  return `---\n${stringifyFrontmatter(slide.frontmatterData, slide.layout)}\n---\n${slide.bodyMarkdown}`.trim();
}

function resolveFooterForSlide(
  index: number,
  explicitFooter: unknown,
  deckDefaultFooter: unknown
): unknown {
  const directive = parseFooterDirective(explicitFooter);

  if (index === 0) {
    return directive.type === "value" ? directive.value : undefined;
  }

  if (directive.type === "value") {
    return directive.value;
  }

  if (directive.type === "disabled") {
    return undefined;
  }

  return deckDefaultFooter;
}

function clonePartialValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => clonePartialValue(entry));
  }

  if (value && typeof value === "object") {
    const source = value as Record<string, unknown>;
    const next: Record<string, unknown> = {};

    for (const [key, entry] of Object.entries(source)) {
      next[key] = clonePartialValue(entry);
    }

    return next;
  }

  return value;
}

function parseSlidesFromSegments(
  parsedSegments: ParsedDeckSegment[],
  templateRegistry: SlideTemplateRegistry
): ParsedDeck {
  const fallbackTemplate = templateRegistry[fallbackLayout];
  const deckDiagnostics: SlideDiagnostic[] = [];
  const firstSlideFooter = parseFooterDirective(
    parsedSegments[0]?.parsedFrontmatter.frontmatterData.footer
  );
  const deckDefaultFooter =
    firstSlideFooter.type === "value" ? firstSlideFooter.value : undefined;

  const slides = parsedSegments.map(({ segment, parsedFrontmatter }, index) => {
    const frontmatterLayout = parsedFrontmatter.frontmatter.layout?.trim();
    const layout =
      typeof frontmatterLayout === "string" && frontmatterLayout.length > 0
        ? frontmatterLayout
        : defaultLayout;
    const frontmatterData = parsedFrontmatter.frontmatterData;
    const resolvedFrontmatter = {
      ...parsedFrontmatter.frontmatter
    };
    const resolvedPartials: Record<string, unknown> = {};
    const resolvedFooter = resolveFooterForSlide(
      index,
      frontmatterData.footer,
      deckDefaultFooter
    );
    if (typeof resolvedFooter !== "undefined") {
      resolvedPartials.footer = clonePartialValue(resolvedFooter);
    }

    if (typeof resolvedFooter === "string") {
      resolvedFrontmatter.footer = resolvedFooter;
    } else {
      delete resolvedFrontmatter.footer;
    }

    const astInputResult = createSlideAstInputFromMarkdown({
      layout,
      markdown: parsedFrontmatter.bodyMarkdown,
      frontmatter: parsedFrontmatter.frontmatter,
      frontmatterData: parsedFrontmatter.frontmatterData
    });

    const registryEntry = templateRegistry[layout];
    const decodeTarget = registryEntry ?? fallbackTemplate;

    const diagnostics = [...astInputResult.diagnostics];

    if (!registryEntry && fallbackTemplate) {
      diagnostics.push({
        severity: "warning",
        message: `Unknown layout '${layout}'. Falling back to '${fallbackLayout}' template validation.`,
        code: "unknown_layout_fallback",
        field: "layout"
      });
    }

    if (decodeTarget) {
      const decodeResult = decodeSlideTemplate(decodeTarget, astInputResult.input);
      diagnostics.push(...decodeResult.diagnostics);
    }

    if (diagnostics.length > 0) {
      deckDiagnostics.push(
        ...diagnostics.map((diagnostic) => ({
          ...diagnostic,
          message: `Slide ${index + 1}: ${diagnostic.message}`
        }))
      );
    }

    return {
      id: `slide-${index + 1}`,
      layout,
      rawMarkdown: segment.trim(),
      bodyMarkdown: parsedFrontmatter.bodyMarkdown,
      title: extractTitle(astInputResult.input.contentMarkdown),
      frontmatter: parsedFrontmatter.frontmatter,
      frontmatterData,
      resolvedFrontmatter,
      resolvedPartials,
      containers: normalizeContainersForTemplate(
        astInputResult.input.containers,
        registryEntry
      ),
      diagnostics
    } satisfies ParsedSlide;
  });

  const normalizedMarkdown = slides
    .map((slide) => normalizeSlideMarkdown(slide))
    .join("\n\n");

  return {
    slides,
    normalizedMarkdown,
    diagnostics: deckDiagnostics
  };
}

export function parseDeckMarkdown(
  input: string,
  options: ParseDeckMarkdownOptions = {}
): ParsedDeck {
  const source = input.trim();
  if (!source) {
    return {
      slides: [],
      normalizedMarkdown: "",
      diagnostics: []
    };
  }

  const templateRegistry = options.templateRegistry ?? defaultTemplateRegistry;
  const segments = extractTopLevelSegments(source);
  const parsedSegments: ParsedDeckSegment[] = segments.map((segment) => ({
    segment,
    parsedFrontmatter: parseFrontmatter(segment)
  }));
  return parseSlidesFromSegments(parsedSegments, templateRegistry);
}

export function parseSingleSlideMarkdown(
  markdown: string,
  options: ParseSingleSlideMarkdownOptions = {}
): ParseSingleSlideMarkdownResult {
  const source = markdown.trim();
  if (!source) {
    return {
      slide: null,
      diagnostics: []
    };
  }

  const templateRegistry = options.templateRegistry ?? defaultTemplateRegistry;
  const parsedDeck = parseSlidesFromSegments(
    [
      {
        segment: source,
        parsedFrontmatter: parseFrontmatter(source)
      }
    ],
    templateRegistry
  );
  const baseSlide = parsedDeck.slides[0];
  if (!baseSlide) {
    return {
      slide: null,
      diagnostics: []
    };
  }

  const diagnostics = [...baseSlide.diagnostics];
  if (options.recoveredBoundary) {
    diagnostics.push({
      severity: "warning",
      message: tolerantBoundaryRecoveryMessage,
      code: "tolerant_boundary_recovery"
    });
  }

  const slide: ParsedSlide = {
    ...baseSlide,
    id: options.id ?? baseSlide.id,
    diagnostics
  };

  return {
    slide,
    diagnostics
  };
}

export function toSlideDocuments(parsedDeck: ParsedDeck): SlideDocument[] {
  return parsedDeck.slides.map((slide) => ({
    id: slide.id,
    layout: slide.layout,
    rawMarkdown: slide.rawMarkdown,
    resolvedFrontmatter: slide.resolvedFrontmatter,
    resolvedPartials: slide.resolvedPartials,
    containers: slide.containers,
    diagnostics: slide.diagnostics
  }));
}
