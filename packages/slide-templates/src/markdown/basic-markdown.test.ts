import { describe, expect, it } from "vitest";
import { parseBasicMarkdownSegments } from "./basic-markdown";

describe("parseBasicMarkdownSegments", () => {
  it("splits markdown and infoBox fenced blocks into render segments", () => {
    const markdown = [
      "Top paragraph.",
      "",
      "::: infoBox",
      "**Objective:** Deliver a scalable Design System v1.",
      ":::",
      "",
      "Closing paragraph."
    ].join("\n");

    expect(parseBasicMarkdownSegments(markdown)).toEqual([
      {
        kind: "markdown",
        markdown: "Top paragraph."
      },
      {
        kind: "infoBox",
        markdown: "**Objective:** Deliver a scalable Design System v1."
      },
      {
        kind: "markdown",
        markdown: "Closing paragraph."
      }
    ]);
  });

  it("parses infoBox flags and attributes from the opening fence", () => {
    const markdown = [
      "Top paragraph.",
      "",
      "::: infoBox stretch tone=sand",
      "**Objective:** Deliver a scalable Design System v1.",
      ":::",
      "",
      "Closing paragraph."
    ].join("\n");

    expect(parseBasicMarkdownSegments(markdown)).toEqual([
      {
        kind: "markdown",
        markdown: "Top paragraph."
      },
      {
        kind: "infoBox",
        params: {
          tokens: ["stretch", "tone=sand"],
          flags: ["stretch"],
          attributes: {
            tone: "sand"
          }
        },
        markdown: "**Objective:** Deliver a scalable Design System v1."
      },
      {
        kind: "markdown",
        markdown: "Closing paragraph."
      }
    ]);
  });

  it("falls back to plain markdown when an infoBox container is unclosed", () => {
    const markdown = ["::: infoBox stretch", "**Objective:** Missing close"].join("\n");

    expect(parseBasicMarkdownSegments(markdown)).toEqual([
      {
        kind: "markdown",
        markdown: "::: infoBox stretch\n**Objective:** Missing close"
      }
    ]);
  });

  it("splits markdown and divivderList fenced blocks into render segments", () => {
    const markdown = [
      "Top paragraph.",
      "",
      "::: divivderList",
      "- First",
      "- Second",
      ":::",
      "",
      "Closing paragraph."
    ].join("\n");

    expect(parseBasicMarkdownSegments(markdown)).toEqual([
      {
        kind: "markdown",
        markdown: "Top paragraph."
      },
      {
        kind: "divivderList",
        markdown: "- First\n- Second"
      },
      {
        kind: "markdown",
        markdown: "Closing paragraph."
      }
    ]);
  });
});
