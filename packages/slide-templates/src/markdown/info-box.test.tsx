import type { ReactElement } from "react";
import { describe, expect, it } from "vitest";
import { InfoBox } from "./info-box";

describe("InfoBox", () => {
  it("adds h-full when stretch is enabled", () => {
    const element = InfoBox({
      markdown: "Body",
      stretch: true
    }) as ReactElement<{ className?: string }>;

    expect(element.props.className).toContain("h-full");
  });

  it("does not add h-full by default", () => {
    const element = InfoBox({
      markdown: "Body"
    }) as ReactElement<{ className?: string }>;

    expect(element.props.className).not.toContain("h-full");
  });
});
