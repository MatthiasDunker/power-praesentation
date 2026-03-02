import { describe, expect, it } from "vitest";
import { parseFencedContainers } from "./fenced-containers";

describe("parseFencedContainers", () => {
  it("keeps nested fenced blocks inside a parent container markdown body", () => {
    const markdown = [
      "Intro copy",
      "",
      "::: leftColumn",
      "Left content",
      ":::",
      "",
      "::: rightColumn",
      "::: infoBox",
      "**Objective:** Deliver a scalable Design System v1.",
      ":::",
      "Supporting text",
      ":::"
    ].join("\n");

    const parsed = parseFencedContainers(markdown);

    expect(parsed.diagnostics).toEqual([]);
    expect(parsed.contentMarkdown).toBe("Intro copy");
    expect(parsed.containers).toHaveLength(2);
    expect(parsed.containers[0]?.kind).toBe("leftColumn");
    expect(parsed.containers[0]?.markdown).toBe("Left content");
    expect(parsed.containers[1]?.kind).toBe("rightColumn");
    expect(parsed.containers[1]?.markdown).toBe(
      "::: infoBox\n**Objective:** Deliver a scalable Design System v1.\n:::\nSupporting text"
    );
  });
});
