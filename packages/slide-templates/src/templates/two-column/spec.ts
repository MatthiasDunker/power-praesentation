import { asNonEmptyString, toThemeClassName } from "../../decode-engine";
import { parseMarkdownAst } from "../../markdown-ast";
import type { SlideContainerRule, SlideTemplateDefinition } from "../../types";
import type { TwoColumnTemplateProps } from "../shared";

export const twoColumnContainerRules: readonly SlideContainerRule[] = [
  {
    kind: "leftColumn",
    min: 1,
    max: 1,
  },
  {
    kind: "rightColumn",
    min: 1,
    max: 1,
  },
];

function toNodeArray(value: unknown): Record<string, unknown>[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((entry) => entry && typeof entry === "object") as Record<
    string,
    unknown
  >[];
}

function paragraphToText(node: Record<string, unknown>): string {
  const children = toNodeArray(node.children);
  const parts: string[] = [];

  for (const child of children) {
    if (child.type === "text" || child.type === "inlineCode") {
      const value = typeof child.value === "string" ? child.value : "";
      parts.push(value);
      continue;
    }

    if (
      child.type === "emphasis" ||
      child.type === "strong" ||
      child.type === "link" ||
      child.type === "delete"
    ) {
      parts.push(paragraphToText(child));
      continue;
    }

    if (child.type === "break") {
      parts.push("\n");
    }
  }

  return parts.join("").trim();
}

function extractLeadFromBody(bodyMarkdown: string): string | undefined {
  const normalized = bodyMarkdown.replace(/\r\n?/g, "\n");
  const lines = normalized.split("\n");
  const firstColumnIndex = lines.findIndex((line) =>
    /^:::\s*(leftColumn|rightColumn)\s*$/.test(line.trim()),
  );
  const leadRangeMarkdown =
    firstColumnIndex >= 0
      ? lines.slice(0, firstColumnIndex).join("\n")
      : normalized;
  const ast = parseMarkdownAst(leadRangeMarkdown);
  const children = toNodeArray(ast.children);
  const leadParagraphs: string[] = [];
  let seenTitle = false;

  for (const node of children) {
    if (node.type === "heading" && node.depth === 1) {
      seenTitle = true;
      continue;
    }

    if (node.type !== "paragraph" || !seenTitle) {
      continue;
    }

    const text = paragraphToText(node);
    if (text.length > 0) {
      leadParagraphs.push(text);
    }
  }

  if (leadParagraphs.length === 0) {
    return undefined;
  }

  return leadParagraphs.join("\n\n");
}

export const twoColumnTemplateDefinition: SlideTemplateDefinition<TwoColumnTemplateProps> =
  {
    id: "two-column",
    containerRules: twoColumnContainerRules,
    decoder: {
      kind: "schema",
      schema: {
        fields: {
          title: {
            sources: [{ kind: "heading", depth: 1, nonEmpty: true }],
            transform: (value) => asNonEmptyString(value),
            default: "Untitled",
            missingPolicy: "warning",
          },
          lead: {
            sources: [
              {
                kind: "custom",
                resolve: (context) =>
                  extractLeadFromBody(context.input.bodyMarkdown),
              },
            ],
            transform: (value) => asNonEmptyString(value),
          },
          leftColumn: {
            sources: [
              {
                kind: "container",
                containerKind: "leftColumn",
                index: 0,
                nonEmpty: true,
              },
            ],
            default: "",
            missingPolicy: "warning",
          },
          rightColumn: {
            sources: [
              {
                kind: "container",
                containerKind: "rightColumn",
                index: 0,
                nonEmpty: true,
              },
            ],
            default: "",
            missingPolicy: "warning",
          },
          className: {
            sources: [{ kind: "frontmatter", key: "theme", nonEmpty: true }],
            transform: (value) => toThemeClassName(value),
            default: "theme-default",
          },
        },
      },
    },
  };
