import type { ReactElement, ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { FooterPartial } from "./footer";

type ColumnElement = ReactElement<{ children: unknown }>;

function toElementArray(children: ReactNode): ColumnElement[] {
  if (Array.isArray(children)) {
    return children.filter(Boolean) as ColumnElement[];
  }

  return children ? ([children] as ColumnElement[]) : [];
}

describe("FooterPartial", () => {
  it("renders null and undefined column values as empty strings", () => {
    const element = FooterPartial({
      value: {
        cols: ["First col", null, undefined, "{{page}}/{{pages}}"]
      }
    }) as ReactElement<{ children: ReactNode }> | null;

    expect(element).toBeTruthy();
    expect(element?.type).toBe("div");

    const columnNodes = toElementArray(element?.props.children);
    const columnText = columnNodes.map((node) => node.props.children);

    expect(columnText).toEqual(["First col", "", "", "{{page}}/{{pages}}"]);
    expect(columnText).not.toContain("null");
    expect(columnText).not.toContain("undefined");
  });
});
