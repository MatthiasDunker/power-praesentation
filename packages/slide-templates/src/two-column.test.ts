import { describe, expect, it } from "vitest";
import { createCoreTemplateRegistry } from "./index";

describe("two-column decoder", () => {
  it("warns when columns are missing", () => {
    const registry = createCoreTemplateRegistry();
    const decode = registry["two-column"]?.decode;

    const result = decode?.({
      layout: "two-column",
      frontmatter: {},
      bodyMarkdown: "",
      contentMarkdown: "",
      ast: { type: "root", children: [] },
      containers: []
    });

    expect(result?.warnings.join(" ")).toContain("expects 2 '::: column' containers, found 0");
  });

  it("warns when extra columns are provided", () => {
    const registry = createCoreTemplateRegistry();
    const decode = registry["two-column"]?.decode;

    const result = decode?.({
      layout: "two-column",
      frontmatter: {},
      bodyMarkdown: "",
      contentMarkdown: "",
      ast: { type: "root", children: [] },
      containers: [
        {
          type: "fenced_container",
          kind: "column",
          markdown: "A",
          ast: { type: "root", children: [] },
          lineStart: 1,
          lineEnd: 1
        },
        {
          type: "fenced_container",
          kind: "column",
          markdown: "B",
          ast: { type: "root", children: [] },
          lineStart: 2,
          lineEnd: 2
        },
        {
          type: "fenced_container",
          kind: "column",
          markdown: "C",
          ast: { type: "root", children: [] },
          lineStart: 3,
          lineEnd: 3
        }
      ]
    });

    expect(result?.warnings.join(" ")).toContain("Extra columns are ignored");
    expect(result?.props).toEqual({
      leftMarkdown: "A",
      rightMarkdown: "B"
    });
  });
});
