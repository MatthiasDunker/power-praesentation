import { expect, test, type Page } from "@playwright/test";

const navSelectionSwapDebounceMs = 250;

function sseEvent(payload: object): string {
  return `data: ${JSON.stringify(payload)}\n\n`;
}

function titleHeroSlide(index: number) {
  return {
    id: `slide-${index}`,
    layout: "title-hero" as const,
    rawMarkdown: `---\nlayout: title-hero\n---\n# Slide ${index}\n\nBody ${index}`,
    containers: [],
    diagnostics: []
  };
}

function thumbnailFor(page: Page, slideId: string) {
  return page.getByTestId(`slide-thumbnail-${slideId}`);
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
          diagnostics: []
        },
        {
          id: "slide-2",
          layout: "two-column",
          rawMarkdown:
            "---\nlayout: two-column\n---\n# Compare\n\n::: leftColumn\nLeft\n:::\n\n::: rightColumn\nRight\n:::",
          containers: [
            { kind: "leftColumn", markdown: "Left" },
            { kind: "rightColumn", markdown: "Right" }
          ],
          diagnostics: []
        }
      ],
      fullMarkdown:
        "---\nlayout: title-hero\n---\n# Intro\n\nHello\n\n---\n\n---\nlayout: two-column\n---\n# Compare\n\n::: leftColumn\nLeft\n:::\n\n::: rightColumn\nRight\n:::",
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
          diagnostics: []
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
  await expect(thumbnailFor(page, "slide-1")).toHaveAttribute("data-thumbnail-mode", "bitmap");
  await expect(thumbnailFor(page, "slide-2")).toHaveAttribute("data-thumbnail-mode", "bitmap");
  await expect(thumbnailFor(page, "slide-1").locator("img")).toHaveAttribute("src", /^data:image\/png;base64,/);
  await expect(thumbnailFor(page, "slide-2").locator("img")).toHaveAttribute("src", /^data:image\/png;base64,/);

  const firstSlideEditor = page.getByLabel("Deck markdown for slide 1");
  const secondSlideEditor = page.getByLabel("Deck markdown for slide 2");
  const firstThumbnailBeforeEdit = await thumbnailFor(page, "slide-1").locator("img").getAttribute("src");

  await page.getByRole("button", { name: /Slide 2/i }).click();
  await expect(thumbnailFor(page, "slide-2")).toHaveAttribute("data-thumbnail-mode", "bitmap");
  await expect(thumbnailFor(page, "slide-1")).toHaveAttribute("data-thumbnail-mode", "bitmap");

  await firstSlideEditor.click();
  await expect(thumbnailFor(page, "slide-1")).toHaveAttribute("data-thumbnail-mode", "live");
  await expect(thumbnailFor(page, "slide-2")).toHaveAttribute("data-thumbnail-mode", "bitmap");

  await firstSlideEditor.fill("---\nlayout: title-hero\n---\n# Updated intro\n\nNew copy");
  await expect(thumbnailFor(page, "slide-1")).toHaveAttribute("data-thumbnail-mode", "live");

  await expect(page.getByTestId("live-slide-page").locator("h1")).toContainText("Updated intro");

  await secondSlideEditor.click();
  await expect(thumbnailFor(page, "slide-2")).toHaveAttribute("data-thumbnail-mode", "live");
  await expect(thumbnailFor(page, "slide-1")).toHaveAttribute("data-thumbnail-mode", "bitmap");

  await expect
    .poll(async () => thumbnailFor(page, "slide-1").locator("img").getAttribute("src"))
    .not.toEqual(firstThumbnailBeforeEdit);

  await expect(secondSlideEditor).toHaveAttribute("data-active", "true");
  await expect(firstSlideEditor).toHaveAttribute("data-active", "false");
  await expect(page.getByTestId("live-slide-page")).toContainText("Left");

  await expect(page.getByTestId("print-pages").locator("article")).toHaveCount(2);
});

test("deletes a slide from the thumbnail context menu", async ({ page }) => {
  await page.route("**/api/decks/generate", async (route) => {
    const deck = {
      deckId: "deck-delete-slide-e2e",
      slides: [titleHeroSlide(1), titleHeroSlide(2)],
      fullMarkdown: [titleHeroSlide(1).rawMarkdown, titleHeroSlide(2).rawMarkdown].join("\n\n---\n\n"),
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
        { id: "1", title: "Slide 1", summary: "Body 1", intent: "intro" },
        { id: "2", title: "Slide 2", summary: "Body 2", intent: "detail" }
      ]
    };

    const body = [
      sseEvent({ type: "task_started", taskId: "ingest_input", message: "Collecting" }),
      sseEvent({ type: "task_completed", taskId: "ingest_input", message: "Done" }),
      sseEvent({ type: "task_started", taskId: "compose_slides", message: "Composing" }),
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
  await page.getByLabel("Prompt").fill("Create a short deck");
  await page.getByRole("button", { name: "Generate deck" }).click();

  await expect(page.getByText("Generated 2 slides", { exact: false })).toBeVisible();
  await expect(thumbnailFor(page, "slide-1")).toBeVisible();
  await expect(thumbnailFor(page, "slide-2")).toBeVisible();

  await page.getByRole("button", { name: /Slide 1/i }).click({ button: "right" });
  await page.getByRole("menuitem", { name: "Delete" }).click();

  await expect(thumbnailFor(page, "slide-1")).toHaveCount(0);
  await expect(thumbnailFor(page, "slide-2")).toBeVisible();
  await expect(page.getByTestId("print-pages").locator("article")).toHaveCount(1);
  await expect(page.getByTestId("live-slide-page").locator("h1")).toContainText("Slide 2");
});

test("clicking slide nav scrolls markdown editor to selected slide", async ({ page }) => {
  await page.route("**/api/decks/generate", async (route) => {
    const slides = Array.from({ length: 6 }, (_, index) => titleHeroSlide(index + 1));
    const deck = {
      deckId: "deck-scroll-e2e",
      slides,
      fullMarkdown: slides.map((slide) => slide.rawMarkdown).join("\n\n---\n\n"),
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
      outline: slides.map((slide, index) => ({
        id: String(index + 1),
        title: `Slide ${index + 1}`,
        summary: `Body ${index + 1}`,
        intent: "content"
      }))
    };

    const body = [
      sseEvent({ type: "task_started", taskId: "ingest_input", message: "Collecting" }),
      sseEvent({ type: "task_completed", taskId: "ingest_input", message: "Done" }),
      sseEvent({ type: "task_started", taskId: "compose_slides", message: "Composing" }),
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
  await page.getByLabel("Prompt").fill("Create a 6 slide deck");
  await page.getByRole("button", { name: "Generate deck" }).click();

  await expect(page.getByText("Generated 6 slides", { exact: false })).toBeVisible();
  await expect(page.getByTestId("workspace-shell")).toBeVisible();
  await expect(thumbnailFor(page, "slide-1")).toHaveAttribute("data-thumbnail-mode", "bitmap");

  const firstSlideEditor = page.getByLabel("Deck markdown for slide 1");

  await firstSlideEditor.fill("---\nlayout: title-hero\n---\n# Slide 1 edited\n\nBody 1");
  await expect(thumbnailFor(page, "slide-1")).toHaveAttribute("data-thumbnail-mode", "live");

  const editorContainer = page.getByLabel("Deck markdown editor");
  const topBefore = await editorContainer.evaluate((node) => node.scrollTop);

  await page.getByRole("button", { name: /Slide 6/i }).click();
  await expect(thumbnailFor(page, "slide-6")).toHaveAttribute("data-thumbnail-mode", "bitmap");
  await expect(thumbnailFor(page, "slide-1")).toHaveAttribute("data-thumbnail-mode", "live");
  await page.waitForTimeout(navSelectionSwapDebounceMs + 80);
  await expect.poll(async () => thumbnailFor(page, "slide-1").getAttribute("data-thumbnail-mode")).toBe("bitmap");

  await expect(page.getByLabel("Deck markdown for slide 6")).toHaveAttribute("data-active", "true");
  await expect(page.getByTestId("live-slide-page").locator("h1")).toContainText("Slide 6");
  await expect
    .poll(async () => editorContainer.evaluate((node) => node.scrollTop))
    .toBeGreaterThan(topBefore);
});

test("shows warning and error diagnostics in markdown editor popovers and nav icons", async ({
  page
}) => {
  await page.route("**/api/decks/generate", async (route) => {
    const deck = {
      deckId: "deck-diagnostics-e2e",
      slides: [
        {
          id: "slide-1",
          layout: "title-hero",
          rawMarkdown: "---\nlayout: title-hero\n---\n# Diagnostics",
          containers: [],
          diagnostics: [
            {
              severity: "warning",
              message: "Layout 'title-hero' could not resolve required field 'text'."
            },
            {
              severity: "error",
              message: "Layout 'title-hero' could not resolve required field 'title'."
            }
          ]
        }
      ],
      fullMarkdown: "---\nlayout: title-hero\n---\n# Diagnostics",
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
      outline: [{ id: "1", title: "Diagnostics", summary: "Validation", intent: "diagnostics" }]
    };

    const body = [
      sseEvent({ type: "task_started", taskId: "ingest_input", message: "Collecting" }),
      sseEvent({ type: "task_completed", taskId: "ingest_input", message: "Done" }),
      sseEvent({ type: "task_started", taskId: "compose_slides", message: "Composing" }),
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
  await page.getByLabel("Prompt").fill("Create a diagnostics deck");
  await page.getByRole("button", { name: "Generate deck" }).click();

  await expect(page.getByText("Generated 1 slides", { exact: false })).toBeVisible();
  await expect(page.getByLabel("Show warning diagnostics for slide 1")).toBeVisible();
  await expect(page.getByLabel("Show error diagnostics for slide 1")).toBeVisible();
  await expect(page.getByTestId("slide-diagnostics-slide-1")).toContainText("1");

  await page.getByLabel("Show warning diagnostics for slide 1").click();
  await expect(
    page.getByText("Layout 'title-hero' could not resolve required field 'text'.")
  ).toBeVisible();

  await page.getByLabel("Show error diagnostics for slide 1").click();
  await expect(
    page.getByText("Layout 'title-hero' could not resolve required field 'title'.")
  ).toBeVisible();
});

test("keeps slide blocks stable while a fenced container closing tag is temporarily missing", async ({
  page
}) => {
  await page.route("**/api/decks/generate", async (route) => {
    const deck = {
      deckId: "deck-unclosed-container",
      slides: [
        {
          id: "slide-1",
          layout: "two-column",
          rawMarkdown:
            "---\nlayout: two-column\n---\n# Compare\n\n::: leftColumn\nLeft\n:::\n\n::: rightColumn\nRight\n:::",
          containers: [
            { kind: "leftColumn", markdown: "Left" },
            { kind: "rightColumn", markdown: "Right" }
          ],
          diagnostics: []
        },
        {
          id: "slide-2",
          layout: "title-hero",
          rawMarkdown: "---\nlayout: title-hero\n---\n# Follow-up\n\nStable slide",
          containers: [],
          diagnostics: []
        }
      ],
      fullMarkdown:
        "---\nlayout: two-column\n---\n# Compare\n\n::: leftColumn\nLeft\n:::\n\n::: rightColumn\nRight\n:::\n\n---\n\n---\nlayout: title-hero\n---\n# Follow-up\n\nStable slide",
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
        { id: "1", title: "Compare", summary: "Left and right", intent: "compare" },
        { id: "2", title: "Follow-up", summary: "Stable", intent: "detail" }
      ]
    };

    const body = [
      sseEvent({ type: "task_started", taskId: "ingest_input", message: "Collecting" }),
      sseEvent({ type: "task_completed", taskId: "ingest_input", message: "Done" }),
      sseEvent({ type: "task_started", taskId: "compose_slides", message: "Composing" }),
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
  await page.getByLabel("Prompt").fill("Create a deck with two-column content");
  await page.getByRole("button", { name: "Generate deck" }).click();

  await expect(page.getByText("Generated 2 slides", { exact: false })).toBeVisible();

  const firstSlideEditor = page.getByLabel("Deck markdown for slide 1");
  const secondSlideEditor = page.getByLabel("Deck markdown for slide 2");

  await expect(firstSlideEditor).toBeVisible();
  await expect(secondSlideEditor).toBeVisible();
  await expect(secondSlideEditor).toHaveValue(/layout: title-hero/);

  await firstSlideEditor.fill(
    "---\nlayout: two-column\n---\n# Compare\n\n::: leftColumn\nLeft side stays open"
  );

  await expect(secondSlideEditor).toBeVisible();
  await expect(secondSlideEditor).toHaveValue(/layout: title-hero/);
  await expect(page.getByRole("button", { name: /Slide 2/i })).toBeVisible();

  const warningButton = page.getByLabel("Show warning diagnostics for slide 1");
  await expect(warningButton).toBeVisible();
  await warningButton.click();
  await expect(
    page.getByText("Recovered slide boundary at '---' while fenced container was still open.")
  ).toBeVisible();

  await firstSlideEditor.fill(
    "---\nlayout: two-column\n---\n# Compare\n\n::: leftColumn\nLeft\n:::\n\n::: rightColumn\nRight\n:::"
  );
  await expect(warningButton).toBeHidden();
});
