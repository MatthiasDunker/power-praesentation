import type { ReactElement, ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { DividerList } from "./divider-list";

describe("DividerList", () => {
  it("maps list items to block-list-divider class", () => {
    const element = DividerList({
      markdown: "- First item"
    }) as ReactElement<{
      components: {
        li?: (props: { className?: string; children?: ReactNode }) => ReactElement<{
          className?: string;
        }>;
      };
    }>;

    const liRenderer = element.props.components.li;
    expect(typeof liRenderer).toBe("function");

    const rendered = liRenderer ? liRenderer({ children: "Item" }) : null;
    expect(rendered?.props.className).toContain("block-list-divider");
  });
});
