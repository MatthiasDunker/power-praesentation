import { describe, expect, it } from "vitest";
import { selectTemplate } from "./template-matcher";

describe("selectTemplate", () => {
  it("picks deterministic best match", async () => {
    const result = await selectTemplate({
      id: "1",
      title: "Key Metrics",
      summary: "Quarterly KPI impact",
      intent: "Show metric impact"
    });

    expect(result.selected).toBe("metric-highlight");
    expect(result.usedTieBreak).toBe(false);
  });

  it("uses tie-break callback when scores tie", async () => {
    const result = await selectTemplate(
      {
        id: "1",
        title: "Visual Example",
        summary: "Photo and visual story",
        intent: "image"
      },
      async (candidates) => {
        expect(candidates).toContain("image-left-copy");
        expect(candidates).toContain("image-right-copy");
        return "image-right-copy";
      }
    );

    expect(result.selected).toBe("image-right-copy");
    expect(result.usedTieBreak).toBe(true);
  });
});
