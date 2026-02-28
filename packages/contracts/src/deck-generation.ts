import { z } from "zod";

export const coreTemplateIdValues = [
  "title-hero",
  "section-divider",
  "bullet-list",
  "two-column",
  "quote-focus",
  "image-left-copy",
  "image-right-copy",
  "metric-highlight"
] as const;

export type CoreTemplateId = (typeof coreTemplateIdValues)[number];
export type SlideLayoutId = CoreTemplateId | (string & {});
export const templateIdValues = coreTemplateIdValues;
export type TemplateId = CoreTemplateId;

export function isCoreTemplateId(value: string): value is CoreTemplateId {
  return (coreTemplateIdValues as readonly string[]).includes(value);
}

export const generationTaskIdValues = [
  "ingest_input",
  "infer_context",
  "derive_ruleset",
  "build_outline",
  "match_templates",
  "compose_slides"
] as const;

export type GenerationTaskId = (typeof generationTaskIdValues)[number];

export interface GenerateDeckRequest {
  prompt: string;
  contentText?: string;
  attachment?: {
    name: string;
    mimeType: "text/markdown" | "text/plain";
    text: string;
  };
}

export interface SlideContainer {
  kind: string;
  markdown: string;
}

export interface OutlineItem {
  id: string;
  title: string;
  summary: string;
  intent: string;
}

export interface InferredContext {
  audience: string;
  tone: string;
  language: string;
  speechLevel: "simple" | "clear" | "sophisticated";
  objective: string;
}

export interface RuleSet {
  listSentenceSchema: string;
  titleStyle: string;
  maxBulletsPerSlide: number;
  constraints: string[];
}

export interface SlideDocument {
  id: string;
  layout: SlideLayoutId;
  rawMarkdown: string;
  resolvedFrontmatter?: Record<string, string>;
  resolvedPartials?: Record<string, unknown>;
  containers: SlideContainer[];
  warnings: string[];
}

export interface DeckDocument {
  deckId: string;
  slides: SlideDocument[];
  fullMarkdown: string;
  inferredContext: InferredContext;
  ruleset: RuleSet;
  outline: OutlineItem[];
}

export type TaskStartedEvent = {
  type: "task_started";
  taskId: GenerationTaskId;
  message: string;
};

export type TaskProgressEvent = {
  type: "task_progress";
  taskId: GenerationTaskId;
  message: string;
};

export type TaskCompletedEvent = {
  type: "task_completed";
  taskId: GenerationTaskId;
  message: string;
};

export type SlidePartialEvent = {
  type: "slide_partial";
  slide: SlideDocument;
};

export type DeckCompletedEvent = {
  type: "deck_completed";
  deck: DeckDocument;
};

export type GenerationErrorEvent = {
  type: "generation_error";
  message: string;
  taskId?: GenerationTaskId;
};

export type GenerationStreamEvent =
  | TaskStartedEvent
  | TaskProgressEvent
  | TaskCompletedEvent
  | SlidePartialEvent
  | DeckCompletedEvent
  | GenerationErrorEvent;

const taskIdSchema = z.enum(generationTaskIdValues);

const slideContainerSchema = z.object({
  kind: z.string().min(1),
  markdown: z.string()
});

export const slideDocumentSchema = z.object({
  id: z.string().min(1),
  layout: z.string().min(1),
  rawMarkdown: z.string(),
  resolvedFrontmatter: z.record(z.string()).optional(),
  resolvedPartials: z.record(z.unknown()).optional(),
  containers: z.array(slideContainerSchema),
  warnings: z.array(z.string())
});

const inferredContextSchema = z.object({
  audience: z.string(),
  tone: z.string(),
  language: z.string(),
  speechLevel: z.enum(["simple", "clear", "sophisticated"]),
  objective: z.string()
});

const rulesetSchema = z.object({
  listSentenceSchema: z.string(),
  titleStyle: z.string(),
  maxBulletsPerSlide: z.number().int().positive(),
  constraints: z.array(z.string())
});

const outlineItemSchema = z.object({
  id: z.string().min(1),
  title: z.string(),
  summary: z.string(),
  intent: z.string()
});

export const deckDocumentSchema = z.object({
  deckId: z.string().min(1),
  slides: z.array(slideDocumentSchema),
  fullMarkdown: z.string(),
  inferredContext: inferredContextSchema,
  ruleset: rulesetSchema,
  outline: z.array(outlineItemSchema)
});

export const generationStreamEventSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("task_started"),
    taskId: taskIdSchema,
    message: z.string()
  }),
  z.object({
    type: z.literal("task_progress"),
    taskId: taskIdSchema,
    message: z.string()
  }),
  z.object({
    type: z.literal("task_completed"),
    taskId: taskIdSchema,
    message: z.string()
  }),
  z.object({
    type: z.literal("slide_partial"),
    slide: slideDocumentSchema
  }),
  z.object({
    type: z.literal("deck_completed"),
    deck: deckDocumentSchema
  }),
  z.object({
    type: z.literal("generation_error"),
    message: z.string(),
    taskId: taskIdSchema.optional()
  })
]);

export const generateDeckRequestSchema = z.object({
  prompt: z.string().min(1),
  contentText: z.string().optional(),
  attachment: z
    .object({
      name: z.string().min(1),
      mimeType: z.enum(["text/markdown", "text/plain"]),
      text: z.string()
    })
    .optional()
});
