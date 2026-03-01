import { describe, expect, it } from "vitest";
import { generationStreamEventSchema, slideDocumentSchema } from "./deck-generation";

describe("generation stream event schema", () => {
  it("accepts task events", () => {
    const parsed = generationStreamEventSchema.safeParse({
      type: "task_started",
      taskId: "ingest_input",
      message: "start"
    });

    expect(parsed.success).toBe(true);
  });

  it("accepts deck_completed events", () => {
    const parsed = generationStreamEventSchema.safeParse({
      type: "deck_completed",
      deck: {
        deckId: "deck-1",
        slides: [
          {
            id: "slide-1",
            layout: "title-hero",
            rawMarkdown: "# Hello",
            containers: [],
            diagnostics: []
          }
        ],
        fullMarkdown: "# Hello",
        inferredContext: {
          audience: "engineers",
          tone: "clear",
          language: "en",
          speechLevel: "clear",
          objective: "inform"
        },
        ruleset: {
          listSentenceSchema: "start with verb",
          titleStyle: "short",
          maxBulletsPerSlide: 5,
          constraints: []
        },
        outline: [
          {
            id: "1",
            title: "Intro",
            summary: "Overview",
            intent: "introduce"
          }
        ]
      }
    });

    expect(parsed.success).toBe(true);
  });

  it("rejects invalid event payloads", () => {
    const parsed = generationStreamEventSchema.safeParse({
      type: "task_started",
      taskId: "unknown_task"
    });

    expect(parsed.success).toBe(false);
  });

  it("accepts custom layout ids for plugin templates", () => {
    const parsed = slideDocumentSchema.safeParse({
      id: "slide-1",
      layout: "custom/experimental-layout",
      rawMarkdown: "# Hello",
      containers: [],
      diagnostics: []
    });

    expect(parsed.success).toBe(true);
  });

  it("accepts optional resolved frontmatter on slide documents", () => {
    const parsed = slideDocumentSchema.safeParse({
      id: "slide-1",
      layout: "title-hero",
      rawMarkdown: "# Hello",
      resolvedFrontmatter: {
        footer: "Acme Inc. 2026"
      },
      containers: [],
      diagnostics: []
    });

    expect(parsed.success).toBe(true);
  });

  it("accepts optional resolved partials on slide documents", () => {
    const parsed = slideDocumentSchema.safeParse({
      id: "slide-1",
      layout: "title-hero",
      rawMarkdown: "# Hello",
      resolvedPartials: {
        footer: {
          cols: ["2026-02-28", "", "{{page}}/{{totalPages}}"]
        }
      },
      containers: [],
      diagnostics: []
    });

    expect(parsed.success).toBe(true);
  });

  it("accepts structured warning and error diagnostics", () => {
    const parsed = slideDocumentSchema.safeParse({
      id: "slide-1",
      layout: "title-hero",
      rawMarkdown: "# Hello",
      containers: [],
      diagnostics: [
        {
          severity: "warning",
          message: "Missing optional subtitle.",
          code: "missing_optional_field",
          field: "subtitle"
        },
        {
          severity: "error",
          message: "Missing required title.",
          code: "missing_required_field",
          field: "title"
        }
      ]
    });

    expect(parsed.success).toBe(true);
  });
});
