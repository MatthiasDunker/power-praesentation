import { generateText } from "ai";
import type {
  CoreTemplateId,
  DeckCompletedEvent,
  DeckDocument,
  GenerateDeckRequest,
  GenerationTaskId,
  GenerationStreamEvent,
  InferredContext,
  OutlineItem,
  RuleSet,
  SlideDocument
} from "@power/contracts";
import { parseDeckMarkdown, selectTemplate, toSlideDocuments } from "@power/shared";
import {
  getAnalyzeModelName,
  getFallbackModelName,
  getModel,
  getWriteModelName,
  hasOpenRouterApiKey
} from "@/server/integrations/openrouter-client";
import { extractJsonArray, extractJsonObject } from "@/server/lib/json-utils";

function taskStarted(taskId: GenerationTaskId, message: string): GenerationStreamEvent {
  return {
    type: "task_started",
    taskId,
    message
  };
}

function taskProgress(taskId: GenerationTaskId, message: string): GenerationStreamEvent {
  return {
    type: "task_progress",
    taskId,
    message
  };
}

function taskCompleted(taskId: GenerationTaskId, message: string): GenerationStreamEvent {
  return {
    type: "task_completed",
    taskId,
    message
  };
}

function inferSpeechLevel(prompt: string): InferredContext["speechLevel"] {
  const lowered = prompt.toLowerCase();
  if (lowered.includes("simple") || lowered.includes("beginner")) {
    return "simple";
  }

  if (lowered.includes("sophisticated") || lowered.includes("executive") || lowered.includes("advanced")) {
    return "sophisticated";
  }

  return "clear";
}

function inferLanguage(text: string): string {
  if (/\b(der|die|und|ist|nicht|mit)\b/i.test(text)) {
    return "de";
  }

  return "en";
}

function heuristicContext(prompt: string, source: string): InferredContext {
  const combined = `${prompt}\n${source}`;
  const audienceMatch = prompt.match(/for ([^.\n,]+)/i);

  return {
    audience: audienceMatch?.[1]?.trim() ?? "general audience",
    tone: /formal|executive|board/i.test(combined) ? "formal" : "clear",
    language: inferLanguage(combined),
    speechLevel: inferSpeechLevel(combined),
    objective: /persuade|convince/i.test(combined) ? "persuade" : "inform"
  };
}

function heuristicRuleset(prompt: string): RuleSet {
  const constraints: string[] = [];
  if (/start.*verb/i.test(prompt)) {
    constraints.push("List items start with a verb.");
  }
  if (/end.*verb/i.test(prompt)) {
    constraints.push("List items end with a verb.");
  }

  return {
    listSentenceSchema: constraints[0] ?? "List items begin with action-oriented verbs.",
    titleStyle: "Short, specific, and outcome-oriented.",
    maxBulletsPerSlide: 5,
    constraints
  };
}

function extractTextValue(value: unknown, depth = 0): string | null {
  if (depth > 2 || value == null) {
    return null;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const extracted = extractTextValue(item, depth + 1);
      if (extracted) {
        return extracted;
      }
    }
    return null;
  }

  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    const preferredKeys = [
      "titleStyle",
      "listSentenceSchema",
      "style",
      "schema",
      "value",
      "text",
      "label",
      "name",
      "description"
    ];

    for (const key of preferredKeys) {
      if (!(key in record)) {
        continue;
      }

      const extracted = extractTextValue(record[key], depth + 1);
      if (extracted) {
        return extracted;
      }
    }

    for (const nested of Object.values(record)) {
      const extracted = extractTextValue(nested, depth + 1);
      if (extracted) {
        return extracted;
      }
    }
  }

  return null;
}

function extractSource(request: GenerateDeckRequest): string {
  return [request.contentText, request.attachment?.text].filter(Boolean).join("\n\n").trim();
}

function parseHeadingsAsOutline(source: string): OutlineItem[] {
  const headings = source
    .split(/\r?\n/)
    .filter((line) => line.trim().startsWith("# "))
    .map((line) => line.trim().slice(2).trim());

  if (headings.length === 0) {
    const paragraphs = source
      .split(/\n\n+/)
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 6);

    if (paragraphs.length === 0) {
      return [
        { id: "1", title: "Overview", summary: "Introduce the topic and context.", intent: "overview" },
        { id: "2", title: "Key Points", summary: "Highlight the most relevant ideas.", intent: "list" },
        { id: "3", title: "Action", summary: "Describe next steps and expected outcome.", intent: "impact" }
      ];
    }

    return paragraphs.map((paragraph, index) => ({
      id: `${index + 1}`,
      title: paragraph.split(/[.!?]/)[0].slice(0, 60) || `Section ${index + 1}`,
      summary: paragraph,
      intent: index === 0 ? "intro" : "list"
    }));
  }

  return headings.map((heading, index) => ({
    id: `${index + 1}`,
    title: heading,
    summary: `Explain ${heading.toLowerCase()} with concise evidence and outcomes.`,
    intent: index === 0 ? "intro" : "overview"
  }));
}

async function tryAiJsonObject(prompt: string): Promise<Record<string, unknown> | null> {
  if (!hasOpenRouterApiKey()) {
    return null;
  }

  const analyzeModel = getModel(getAnalyzeModelName());
  const fallbackModel = getModel(getFallbackModelName());

  for (const model of [analyzeModel, fallbackModel]) {
    if (!model) {
      continue;
    }

    try {
      const result = await generateText({
        model,
        temperature: 0.2,
        prompt
      });

      const parsed = extractJsonObject(result.text);
      if (parsed) {
        return parsed;
      }
    } catch {
      // Try fallback model.
    }
  }

  return null;
}

async function tryAiJsonArray(prompt: string): Promise<Array<Record<string, unknown>> | null> {
  if (!hasOpenRouterApiKey()) {
    return null;
  }

  const analyzeModel = getModel(getAnalyzeModelName());
  const fallbackModel = getModel(getFallbackModelName());

  for (const model of [analyzeModel, fallbackModel]) {
    if (!model) {
      continue;
    }

    try {
      const result = await generateText({
        model,
        temperature: 0.3,
        prompt
      });

      const parsed = extractJsonArray(result.text);
      if (parsed) {
        return parsed;
      }
    } catch {
      // Try fallback model.
    }
  }

  return null;
}

async function inferContext(prompt: string, source: string): Promise<InferredContext> {
  const heuristic = heuristicContext(prompt, source);

  const ai = await tryAiJsonObject([
    "Infer presentation context and return JSON only.",
    "Shape: { audience, tone, language, speechLevel, objective }",
    "speechLevel must be one of: simple, clear, sophisticated.",
    `Prompt: ${prompt}`,
    `Source:\n${source.slice(0, 4000)}`
  ].join("\n"));

  if (!ai) {
    return heuristic;
  }

  const speechLevelRaw = String(ai.speechLevel ?? heuristic.speechLevel);
  const speechLevel: InferredContext["speechLevel"] =
    speechLevelRaw === "simple" || speechLevelRaw === "clear" || speechLevelRaw === "sophisticated"
      ? speechLevelRaw
      : heuristic.speechLevel;

  return {
    audience: String(ai.audience ?? heuristic.audience),
    tone: String(ai.tone ?? heuristic.tone),
    language: String(ai.language ?? heuristic.language),
    speechLevel,
    objective: String(ai.objective ?? heuristic.objective)
  };
}

async function deriveRuleset(prompt: string, context: InferredContext): Promise<RuleSet> {
  const heuristic = heuristicRuleset(prompt);

  const ai = await tryAiJsonObject([
    "Create a short writing ruleset for slide markdown. Return JSON only.",
    "Shape: { listSentenceSchema, titleStyle, maxBulletsPerSlide, constraints }",
    `Prompt: ${prompt}`,
    `Context: ${JSON.stringify(context)}`
  ].join("\n"));

  if (!ai) {
    return heuristic;
  }

  const normalizedConstraints = Array.isArray(ai.constraints)
    ? ai.constraints
        .map((item) => extractTextValue(item))
        .filter((item): item is string => Boolean(item))
    : heuristic.constraints;

  return {
    listSentenceSchema: extractTextValue(ai.listSentenceSchema) ?? heuristic.listSentenceSchema,
    titleStyle: extractTextValue(ai.titleStyle) ?? heuristic.titleStyle,
    maxBulletsPerSlide:
      typeof ai.maxBulletsPerSlide === "number" && Number.isFinite(ai.maxBulletsPerSlide)
        ? Math.max(3, Math.min(7, Math.round(ai.maxBulletsPerSlide)))
        : heuristic.maxBulletsPerSlide,
    constraints: normalizedConstraints
  };
}

async function buildOutline(prompt: string, source: string): Promise<OutlineItem[]> {
  const heuristic = parseHeadingsAsOutline(source || prompt);

  const aiOutline = await tryAiJsonArray([
    "Create a concise slide outline and return JSON array only.",
    "Each item: { id, title, summary, intent }",
    `Prompt: ${prompt}`,
    `Source:\n${source.slice(0, 8000)}`
  ].join("\n"));

  if (!aiOutline || aiOutline.length === 0) {
    return heuristic;
  }

  return aiOutline.slice(0, 12).map((item, index) => ({
    id: String(item.id ?? index + 1),
    title: String(item.title ?? `Slide ${index + 1}`),
    summary: String(item.summary ?? ""),
    intent: String(item.intent ?? "overview")
  }));
}

async function tieBreakWithModel(
  candidates: CoreTemplateId[],
  item: OutlineItem
): Promise<CoreTemplateId> {
  if (!hasOpenRouterApiKey()) {
    return candidates[0];
  }

  const analyzeModel = getModel(getAnalyzeModelName());
  const fallbackModel = getModel(getFallbackModelName());

  for (const model of [analyzeModel, fallbackModel]) {
    if (!model) {
      continue;
    }

    try {
      const result = await generateText({
        model,
        temperature: 0,
        prompt: [
          "Choose the best template ID from this list and return JSON only.",
          JSON.stringify({ candidates, item })
        ].join("\n")
      });

      const parsed = extractJsonObject(result.text);
      const selected = parsed?.selected;
      if (
        typeof selected === "string" &&
        candidates.includes(selected as CoreTemplateId)
      ) {
        return selected as CoreTemplateId;
      }
    } catch {
      // Try fallback.
    }
  }

  return candidates[0];
}

function composeSlideMarkdown(
  item: OutlineItem,
  layout: CoreTemplateId,
  context: InferredContext,
  ruleset: RuleSet
): string {
  const intro = item.summary || `Explain ${item.title.toLowerCase()}.`;

  if (layout === "two-column") {
    return [
      "---",
      "layout: two-column",
      "---",
      `# ${item.title}`,
      "",
      intro,
      "",
      "::: leftColumn",
      "## Perspective A",
      `- Clarify the primary viewpoint for ${context.audience}.`,
      "- Anchor the key argument with concise evidence.",
      ":::",
      "",
      "::: rightColumn",
      "## Perspective B",
      "- Contrast with an alternative interpretation.",
      "- End with an action-oriented recommendation.",
      ":::"
    ].join("\n");
  }

  if (layout === "metric-highlight") {
    return [
      "---",
      "layout: metric-highlight",
      "---",
      `# ${item.title}`,
      "",
      "## Key metric",
      "- Increase: +24%",
      "- Confidence: High",
      "",
      `_${intro}_`
    ].join("\n");
  }

  if (layout === "quote-focus") {
    return [
      "---",
      "layout: quote-focus",
      "---",
      `# ${item.title}`,
      "",
      `\"${intro}\"`,
      "",
      "- Use this statement to frame discussion."
    ].join("\n");
  }

  if (layout === "section-divider") {
    return [
      "---",
      "layout: section-divider",
      "---",
      `# ${item.title}`,
      "",
      intro
    ].join("\n");
  }

  if (layout === "title-hero") {
    return [
      "---",
      "layout: title-hero",
      "---",
      `# ${item.title}`,
      "",
      intro,
      "",
      `- ${ruleset.listSentenceSchema}`
    ].join("\n");
  }

  if (layout === "image-left-copy" || layout === "image-right-copy") {
    return [
      "---",
      `layout: ${layout}`,
      "---",
      `# ${item.title}`,
      "",
      intro,
      "",
      "- Pair this content with a single supporting visual.",
      "- Keep copy concise and outcome-focused."
    ].join("\n");
  }

  return [
    "---",
    "layout: bullet-list",
    "---",
    `# ${item.title}`,
    "",
    `- ${intro}`,
    "- Keep each point concise and actionable.",
    "- End with a clear next step."
  ].join("\n");
}

function hasTopFrontmatter(markdown: string): boolean {
  const normalized = markdown.replace(/\r\n?/g, "\n").trimStart();
  if (!normalized.startsWith("---\n")) {
    return false;
  }

  const secondLine = normalized.split("\n")[1] ?? "";
  return secondLine.includes(":");
}

function unwrapMarkdownFence(markdown: string): string {
  const trimmed = markdown.trim();
  const fenced = trimmed.match(/^```(?:markdown|md)?\s*\n([\s\S]*?)\n```$/i);
  if (fenced?.[1]) {
    return fenced[1].trim();
  }

  return trimmed;
}

function dropLeadingSlideDelimiter(markdown: string): string {
  const normalized = markdown.replace(/\r\n?/g, "\n").trimStart();
  if (!normalized.startsWith("---\n")) {
    return normalized.trim();
  }

  const afterFirstLine = normalized.slice(4).trimStart();
  if (hasTopFrontmatter(afterFirstLine)) {
    return afterFirstLine.trim();
  }

  return normalized.trim();
}

function normalizeRewrittenSlideMarkdown(candidate: string, fallback: string): string {
  const unwrapped = unwrapMarkdownFence(candidate);
  const cleaned = dropLeadingSlideDelimiter(unwrapped);

  if (!hasTopFrontmatter(cleaned)) {
    return fallback;
  }

  const parsed = parseDeckMarkdown(cleaned);
  const firstSlide = parsed.slides[0];
  if (!firstSlide) {
    return fallback;
  }

  return `---\nlayout: ${firstSlide.layout}\n---\n${firstSlide.bodyMarkdown}`.trim();
}

async function maybeRewriteSlide(slideMarkdown: string, context: InferredContext, ruleset: RuleSet): Promise<string> {
  if (!hasOpenRouterApiKey()) {
    return slideMarkdown;
  }

  const writeModel = getModel(getWriteModelName());
  const fallbackModel = getModel(getFallbackModelName());

  const prompt = [
    "Rewrite this slide markdown while preserving structure and fenced containers.",
    "Do not add new sections, do not break frontmatter.",
    `Context: ${JSON.stringify(context)}`,
    `Ruleset: ${JSON.stringify(ruleset)}`,
    "Return markdown only.",
    slideMarkdown
  ].join("\n\n");

  for (const model of [writeModel, fallbackModel]) {
    if (!model) {
      continue;
    }

    try {
      const result = await generateText({
        model,
        temperature: 0.5,
        prompt
      });

      if (result.text.trim().length > 0) {
        return normalizeRewrittenSlideMarkdown(result.text, slideMarkdown);
      }
    } catch {
      // Try fallback.
    }
  }

  return slideMarkdown;
}

export async function* generateDeckEvents(
  request: GenerateDeckRequest
): AsyncGenerator<GenerationStreamEvent> {
  try {
    const source = extractSource(request);

    yield taskStarted("ingest_input", "Collecting prompt and optional source content.");
    yield taskProgress("ingest_input", source ? "Source content detected." : "No source content provided.");
    yield taskCompleted("ingest_input", "Input ready.");

    yield taskStarted("infer_context", "Inferring audience, tone, and speech level.");
    const inferredContext = await inferContext(request.prompt, source);
    yield taskCompleted("infer_context", "Context inferred.");

    yield taskStarted("derive_ruleset", "Building writing ruleset.");
    const ruleset = await deriveRuleset(request.prompt, inferredContext);
    yield taskCompleted("derive_ruleset", "Ruleset created.");

    yield taskStarted("build_outline", "Constructing narrative outline.");
    const outline = await buildOutline(request.prompt, source);
    yield taskCompleted("build_outline", `Outline contains ${outline.length} items.`);

    yield taskStarted("match_templates", "Matching outline items to templates.");
    const templateSelections: CoreTemplateId[] = [];
    for (const item of outline) {
      const match = await selectTemplate(item, tieBreakWithModel);
      templateSelections.push(match.selected);
    }
    yield taskCompleted("match_templates", "Template matching complete.");

    yield taskStarted("compose_slides", "Composing slide markdown.");
    const slideMarkdownSegments: string[] = [];

    for (let index = 0; index < outline.length; index += 1) {
      const item = outline[index];
      const templateId = templateSelections[index] ?? "bullet-list";
      const baseMarkdown = composeSlideMarkdown(item, templateId, inferredContext, ruleset);
      const slideMarkdown = await maybeRewriteSlide(baseMarkdown, inferredContext, ruleset);
      slideMarkdownSegments.push(slideMarkdown);

      const parsedPartial = parseDeckMarkdown(slideMarkdown);
      const slide = toSlideDocuments(parsedPartial)[0];
      if (slide) {
        yield {
          type: "slide_partial",
          slide: {
            ...slide,
            id: `slide-${index + 1}`
          }
        };
      }
    }

    const fullMarkdown = slideMarkdownSegments.join("\n\n");
    const parsedDeck = parseDeckMarkdown(fullMarkdown);
    const slides: SlideDocument[] = toSlideDocuments(parsedDeck);

    const deck: DeckDocument = {
      deckId: crypto.randomUUID(),
      slides,
      fullMarkdown: parsedDeck.normalizedMarkdown,
      inferredContext,
      ruleset,
      outline
    };

    yield taskCompleted("compose_slides", `Composed ${slides.length} slides.`);

    const completed: DeckCompletedEvent = {
      type: "deck_completed",
      deck
    };

    yield completed;
  } catch (error) {
    yield {
      type: "generation_error",
      message: error instanceof Error ? error.message : "Unknown generation error"
    };
  }
}
