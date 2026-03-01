import type { SlideDocument, SlideLayoutId } from "@power/contracts";
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
  warnings: string[];
}

export interface ParsedDeck {
  slides: ParsedSlide[];
  normalizedMarkdown: string;
  warnings: string[];
}

export interface ParseDeckMarkdownOptions {
  templateRegistry?: SlideTemplateRegistry;
}

const defaultLayout: SlideLayoutId = "bullet-list";
const fallbackLayout: SlideLayoutId = "bullet-list";
const defaultTemplateRegistry = createCoreTemplateRegistry();

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

export function parseDeckMarkdown(
  input: string,
  options: ParseDeckMarkdownOptions = {}
): ParsedDeck {
  const source = input.trim();
  if (!source) {
    return {
      slides: [],
      normalizedMarkdown: "",
      warnings: []
    };
  }

  const templateRegistry = options.templateRegistry ?? defaultTemplateRegistry;
  const fallbackTemplate = templateRegistry[fallbackLayout];
  const segments = extractTopLevelSegments(source);
  const deckWarnings: string[] = [];
  const parsedSegments = segments.map((segment) => ({
    segment,
    parsedFrontmatter: parseFrontmatter(segment)
  }));
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

    const warnings = [...astInputResult.warnings];

    if (!registryEntry && fallbackTemplate) {
      warnings.push(
        `Unknown layout '${layout}'. Falling back to '${fallbackLayout}' template validation.`
      );
    }

    if (decodeTarget) {
      const decodeResult = decodeSlideTemplate(decodeTarget, astInputResult.input);
      warnings.push(...decodeResult.warnings);
    }

    if (warnings.length > 0) {
      deckWarnings.push(`Slide ${index + 1}: ${warnings.join(" ")}`);
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
      warnings
    } satisfies ParsedSlide;
  });

  const normalizedMarkdown = slides
    .map((slide) => normalizeSlideMarkdown(slide))
    .join("\n\n");

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
    resolvedFrontmatter: slide.resolvedFrontmatter,
    resolvedPartials: slide.resolvedPartials,
    containers: slide.containers,
    warnings: slide.warnings
  }));
}
