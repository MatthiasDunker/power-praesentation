import { expect, test } from "@playwright/test";

function sseEvent(payload: object): string {
  return `data: ${JSON.stringify(payload)}\n\n`;
}

test("generates deck, opens workspace, supports markdown edits", async ({ page }) => {
  await page.route("**/api/decks/generate", async (route) => {
    const deck = {
      deckId: "deck-e2e",
      slides: [
        {
          id: "slide-1",
          layout: "title-hero",
          rawMarkdown: "---\nlayout: title-hero\n---\n# Intro\n\nHello",
          containers: [],
          warnings: []
        },
        {
          id: "slide-2",
          layout: "two-column",
          rawMarkdown:
            "---\nlayout: two-column\n---\n# Compare\n\n::: column\nLeft\n:::\n\n::: column\nRight\n:::",
          containers: [
            { kind: "column", markdown: "Left" },
            { kind: "column", markdown: "Right" }
          ],
          warnings: []
        }
      ],
      fullMarkdown:
        "---\nlayout: title-hero\n---\n# Intro\n\nHello\n\n---\n\n---\nlayout: two-column\n---\n# Compare\n\n::: column\nLeft\n:::\n\n::: column\nRight\n:::",
      inferredContext: {
        audience: "exec",
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
        { id: "1", title: "Intro", summary: "Hello", intent: "intro" },
        { id: "2", title: "Compare", summary: "Left vs Right", intent: "compare" }
      ]
    };

    const body = [
      sseEvent({ type: "task_started", taskId: "ingest_input", message: "Collecting" }),
      sseEvent({ type: "task_completed", taskId: "ingest_input", message: "Done" }),
      sseEvent({ type: "task_started", taskId: "compose_slides", message: "Composing" }),
      sseEvent({
        type: "slide_partial",
        slide: {
          id: "slide-1",
          layout: "title-hero",
          rawMarkdown: "---\nlayout: title-hero\n---\n# Intro\n\nHello",
          containers: [],
          warnings: []
        }
      }),
      sseEvent({ type: "task_completed", taskId: "compose_slides", message: "Done" }),
      sseEvent({ type: "deck_completed", deck })
    ].join("");

    await route.fulfill({
      status: 200,
      headers: {
        "content-type": "text/event-stream"
      },
      body
    });
  });

  await page.goto("/");
  await page.getByLabel("Prompt").fill("Create a short intro deck");
  await page.getByRole("button", { name: "Generate deck" }).click();

  await expect(page.getByText("Generated 2 slides", { exact: false })).toBeVisible();
  await expect(page.getByTestId("workspace-shell")).toBeVisible();

  const editor = page.getByLabel("Deck markdown editor");
  await editor.fill("---\nlayout: title-hero\n---\n# Updated intro\n\nNew copy");

  await expect(page.getByTestId("live-slide-page").locator("h1")).toContainText("Updated intro");
  await expect(page.getByTestId("print-pages").locator("article")).toHaveCount(1);
});
