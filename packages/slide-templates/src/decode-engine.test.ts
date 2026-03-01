import { describe, expect, it } from "vitest";
import type { SlideTemplateDefinition } from "./types";
import { decodeSlideTemplate } from "./decode-engine";

describe("decode engine diagnostics", () => {
  it("emits warning when required field is missing even if default exists", () => {
    const template: SlideTemplateDefinition<{ title: string }> = {
      id: "custom-layout",
      containerRules: [],
      decoder: {
        kind: "schema",
        schema: {
          fields: {
            title: {
              sources: [{ kind: "heading", depth: 1, nonEmpty: true }],
              default: "Untitled",
              required: true
            }
          }
        }
      }
    };

    const result = decodeSlideTemplate(template, {
      layout: "custom-layout",
      frontmatter: {},
      frontmatterData: {},
      bodyMarkdown: "",
      contentMarkdown: "",
      ast: { type: "root", children: [] },
      containers: []
    });

    expect(result.props).toEqual({ title: "Untitled" });
    expect(result.diagnostics).toEqual([
      {
        severity: "warning",
        message: "Layout 'custom-layout' could not resolve required field 'title'.",
        code: "missing_required_field",
        field: "title"
      }
    ]);
  });

  it("emits error when missingPolicy is error", () => {
    const template: SlideTemplateDefinition<{ title: string }> = {
      id: "custom-layout",
      containerRules: [],
      decoder: {
        kind: "schema",
        schema: {
          fields: {
            title: {
              sources: [{ kind: "heading", depth: 1, nonEmpty: true }],
              default: "Untitled",
              missingPolicy: "error"
            }
          }
        }
      }
    };

    const result = decodeSlideTemplate(template, {
      layout: "custom-layout",
      frontmatter: {},
      frontmatterData: {},
      bodyMarkdown: "",
      contentMarkdown: "",
      ast: { type: "root", children: [] },
      containers: []
    });

    expect(result.props).toEqual({ title: "Untitled" });
    expect(result.diagnostics).toEqual([
      {
        severity: "error",
        message: "Layout 'custom-layout' could not resolve required field 'title'.",
        code: "missing_required_field",
        field: "title"
      }
    ]);
  });

  it("lets missingPolicy override required alias", () => {
    const template: SlideTemplateDefinition<{ title: string }> = {
      id: "custom-layout",
      containerRules: [],
      decoder: {
        kind: "schema",
        schema: {
          fields: {
            title: {
              sources: [{ kind: "heading", depth: 1, nonEmpty: true }],
              default: "Untitled",
              required: true,
              missingPolicy: "none"
            }
          }
        }
      }
    };

    const result = decodeSlideTemplate(template, {
      layout: "custom-layout",
      frontmatter: {},
      frontmatterData: {},
      bodyMarkdown: "",
      contentMarkdown: "",
      ast: { type: "root", children: [] },
      containers: []
    });

    expect(result.props).toEqual({ title: "Untitled" });
    expect(result.diagnostics).toEqual([]);
  });
});
