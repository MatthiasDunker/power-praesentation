import type { ReactElement, ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { FooterPartial } from "./footer";

type ColumnElement = ReactElement<{ children: ReactNode }>;

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

    const columnNodes = toElementArray(element?.props.children);
    const firstColumn = columnNodes[0] as ReactElement<{ children: ReactNode }>;
    const firstMarkdown = firstColumn.props.children as ReactElement<{ markdown: string }>;
    expect(firstMarkdown.props.markdown).toBe("First col");

    const thirdColumn = columnNodes[2] as ReactElement<{ children: ReactNode }>;
    const thirdMarkdown = thirdColumn.props.children as ReactElement<{ markdown: string }>;
    expect(thirdMarkdown.props.markdown).toBe("");

    const fourthColumn = columnNodes[3] as ReactElement<{ children: ReactNode }>;
    const fourthMarkdown = fourthColumn.props.children as ReactElement<{ markdown: string }>;
    expect(fourthMarkdown.props.markdown).toBe("{{page}}/{{pages}}");
  });

  it("renders markdown links in footer columns as anchor tags", () => {
    const element = FooterPartial({
      value: {
        cols: [
          "Matthias Dunker",
          "[www.interfacedivide.com](https://www.interfacedivide.com)",
          "{{ page }}/{{pages}}"
        ]
      }
    }) as ReactElement<{ children: ReactNode }> | null;

    const columns = toElementArray(element?.props.children);
    const linkColumn = columns[1] as ReactElement<{ children: ReactNode }>;
    const markdownNode = linkColumn.props.children as ReactElement<{ markdown: string }>;

    expect(markdownNode.props.markdown).toBe(
      "[www.interfacedivide.com](https://www.interfacedivide.com)"
    );

    const renderedMarkdownElement = (
      markdownNode.type as (props: { markdown: string }) => ReactElement<{
        children: string;
        components: { a?: (props: unknown) => ReactNode };
      }>
    )(markdownNode.props);

    expect(renderedMarkdownElement.props.children).toBe(
      "[www.interfacedivide.com](https://www.interfacedivide.com)"
    );
    expect(typeof renderedMarkdownElement.props.components.a).toBe("function");
  });
});
