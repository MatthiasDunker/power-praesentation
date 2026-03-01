import type { SlideDiagnostic } from "@power/contracts";
import type {
  SlideAstContainerNode,
  SlideAstInput,
  SlideContainerRule,
  SlideDecodeContext,
  SlideDecodeResult,
  SlideDecodeSchema,
  SlideDecodeSource,
  SlideTemplateDefinition
} from "./types";

type MdNode = Record<string, unknown>;

export function asNonEmptyString(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
    .filter((entry) => entry.length > 0);
}

export function toThemeClassName(value: unknown): string {
  const theme = asNonEmptyString(value);
  if (!theme) {
    return "theme-default";
  }

  return theme.startsWith("theme-") ? theme : `theme-${theme}`;
}

export function decodeSlideTemplate<TProps>(
  template: SlideTemplateDefinition<TProps>,
  input: SlideAstInput
): SlideDecodeResult<TProps> {
  const diagnostics = validateContainerRules(template.id, template.containerRules, input.containers);

  if (template.decoder.kind === "custom") {
    const decoded = template.decoder.decode(input);
    return {
      props: decoded.props,
      diagnostics: [...diagnostics, ...decoded.diagnostics]
    };
  }

  const decoded = decodeWithSchema(template.id, input, template.decoder.schema);
  return {
    props: decoded.props as TProps,
    diagnostics: [...diagnostics, ...decoded.diagnostics]
  };
}

function decodeWithSchema(
  layoutId: string,
  input: SlideAstInput,
  schema: SlideDecodeSchema
): SlideDecodeResult<Record<string, unknown>> {
  const context = buildDecodeContext(input);
  const diagnostics: SlideDiagnostic[] = [];
  const props: Record<string, unknown> = {};

  for (const [fieldName, field] of Object.entries(schema.fields)) {
    let resolvedValue: unknown = undefined;

    for (const source of field.sources) {
      const candidate = resolveSource(source, context);
      if (isResolvedValue(candidate, source)) {
        resolvedValue = candidate;
        break;
      }
    }

    if (typeof resolvedValue === "undefined") {
      const missingPolicy = resolveMissingPolicy(field);
      if (missingPolicy !== "none") {
        diagnostics.push({
          severity: missingPolicy,
          message: `Layout '${layoutId}' could not resolve required field '${fieldName}'.`,
          code: "missing_required_field",
          field: fieldName
        });
      }
    }

    if (typeof resolvedValue === "undefined" && typeof field.default !== "undefined") {
      resolvedValue =
        typeof field.default === "function"
          ? (field.default as (ctx: SlideDecodeContext) => unknown)(context)
          : field.default;
    }

    if (typeof resolvedValue !== "undefined" && field.transform) {
      resolvedValue = field.transform(resolvedValue, context);
    }

    if (typeof resolvedValue !== "undefined") {
      props[fieldName] = resolvedValue;
    }
  }

  return { props, diagnostics };
}

function validateContainerRules(
  layoutId: string,
  rules: readonly SlideContainerRule[],
  containers: SlideAstContainerNode[]
): SlideDiagnostic[] {
  const diagnostics: SlideDiagnostic[] = [];

  for (const rule of rules) {
    const count = containers.filter((container) => container.kind === rule.kind).length;
    const min = Math.max(rule.min, 0);
    const max = Math.max(rule.max, min);

    if (min === max && count < min) {
      diagnostics.push({
        severity: "warning",
        message: `Layout '${layoutId}' expects ${min} '::: ${rule.kind}' containers, found ${count}.`,
        code: "container_count_mismatch",
        field: rule.kind
      });
      continue;
    }

    if (count < min) {
      diagnostics.push({
        severity: "warning",
        message: `Layout '${layoutId}' expects at least ${min} '::: ${rule.kind}' containers, found ${count}.`,
        code: "container_count_mismatch",
        field: rule.kind
      });
      continue;
    }

    if (count > max) {
      const pluralKind = toPlural(rule.kind);
      diagnostics.push({
        severity: "warning",
        message: `Layout '${layoutId}' received more than ${max} ${pluralKind}. Extra ${pluralKind} are ignored.`,
        code: "container_count_exceeded",
        field: rule.kind
      });
    }
  }

  return diagnostics;
}

function resolveMissingPolicy(
  field: SlideDecodeSchema["fields"][string]
): "none" | "warning" | "error" {
  if (field.missingPolicy) {
    return field.missingPolicy;
  }

  if (field.required) {
    return "warning";
  }

  return "none";
}

function toPlural(kind: string): string {
  if (kind.endsWith("s")) {
    return kind;
  }
  return `${kind}s`;
}

function buildDecodeContext(input: SlideAstInput): SlideDecodeContext {
  const headings: SlideDecodeContext["headings"] = [];
  const paragraphs: string[] = [];
  const listItems: string[] = [];

  const astChildren = toNodeArray((input.ast as MdNode).children);

  for (const node of astChildren) {
    if (node.type === "heading") {
      const depth = toHeadingDepth(node.depth);
      if (!depth) {
        continue;
      }

      const text = inlineNodesToText(toNodeArray(node.children));
      if (text.trim().length > 0) {
        headings.push({ depth, text });
      }
      continue;
    }

    if (node.type === "paragraph") {
      const text = inlineNodesToText(toNodeArray(node.children));
      if (text.trim().length > 0) {
        paragraphs.push(text.trim());
      }
      continue;
    }

    if (node.type === "list") {
      listItems.push(...extractListItems(node));
    }
  }

  const containersByKind: Record<string, string[]> = {};
  for (const container of input.containers) {
    if (!(container.kind in containersByKind)) {
      containersByKind[container.kind] = [];
    }
    containersByKind[container.kind].push(container.markdown);
  }

  return {
    input,
    headings,
    paragraphs,
    listItems,
    containersByKind
  };
}

function extractListItems(listNode: MdNode): string[] {
  const items: string[] = [];
  const listChildren = toNodeArray(listNode.children);

  for (const entry of listChildren) {
    if (entry.type !== "listItem") {
      continue;
    }

    const text = blockNodesToText(toNodeArray(entry.children));
    if (text.trim().length > 0) {
      items.push(text.trim());
    }
  }

  return items;
}

function blockNodesToText(nodes: MdNode[]): string {
  const parts: string[] = [];

  for (const node of nodes) {
    if (node.type === "paragraph" || node.type === "heading") {
      const text = inlineNodesToText(toNodeArray(node.children)).trim();
      if (text.length > 0) {
        parts.push(text);
      }
      continue;
    }

    if (node.type === "list") {
      const nestedItems = extractListItems(node);
      if (nestedItems.length > 0) {
        parts.push(nestedItems.join(" "));
      }
      continue;
    }

    if (node.type === "blockquote") {
      const text = blockNodesToText(toNodeArray(node.children)).trim();
      if (text.length > 0) {
        parts.push(text);
      }
      continue;
    }
  }

  return parts.join(" ").trim();
}

function inlineNodesToText(nodes: MdNode[]): string {
  const parts: string[] = [];

  for (const node of nodes) {
    if (node.type === "text") {
      const value = typeof node.value === "string" ? node.value : "";
      parts.push(value);
      continue;
    }

    if (node.type === "inlineCode") {
      const value = typeof node.value === "string" ? node.value : "";
      parts.push(value);
      continue;
    }

    if (node.type === "image") {
      const alt = typeof node.alt === "string" ? node.alt : "";
      if (alt.trim().length > 0) {
        parts.push(alt);
      }
      continue;
    }

    if (node.type === "break") {
      parts.push("\n");
      continue;
    }

    if (
      node.type === "emphasis" ||
      node.type === "strong" ||
      node.type === "link" ||
      node.type === "delete"
    ) {
      parts.push(inlineNodesToText(toNodeArray(node.children)));
      continue;
    }
  }

  return parts.join("").trim();
}

function resolveSource(source: SlideDecodeSource, context: SlideDecodeContext): unknown {
  switch (source.kind) {
    case "frontmatter":
      return context.input.frontmatter[source.key];
    case "contentMarkdown":
      return context.input.contentMarkdown;
    case "heading": {
      const index = source.index ?? 0;
      return context.headings.filter((entry) => entry.depth === source.depth)[index]?.text;
    }
    case "paragraph": {
      const index = source.index ?? 0;
      return context.paragraphs[index];
    }
    case "paragraphs":
      return [...context.paragraphs];
    case "listItems":
      return [...context.listItems];
    case "container": {
      const index = source.index ?? 0;
      return context.containersByKind[source.containerKind]?.[index];
    }
    case "containers":
      return [...(context.containersByKind[source.containerKind] ?? [])];
    case "literal":
      return source.value;
    case "custom":
      return source.resolve(context);
    default:
      return undefined;
  }
}

function isResolvedValue(value: unknown, source: SlideDecodeSource): boolean {
  if (typeof value === "undefined" || value === null) {
    return false;
  }

  if ("nonEmpty" in source && source.nonEmpty && typeof value === "string") {
    return value.trim().length > 0;
  }

  return true;
}

function toNodeArray(value: unknown): MdNode[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((entry) => entry && typeof entry === "object") as MdNode[];
}

function toHeadingDepth(value: unknown): 1 | 2 | 3 | 4 | 5 | 6 | null {
  if (typeof value !== "number") {
    return null;
  }

  if (value < 1 || value > 6) {
    return null;
  }

  return value as 1 | 2 | 3 | 4 | 5 | 6;
}
