# Slide Template Authoring

## Goal
Define template decoding once in `spec.ts`, keep Markdown authoring linear, and use fenced containers only when needed.

## File Pattern
For each template folder:

1. `spec.ts`
2. `module.ts`
3. `render.tsx`
4. `example.md`

`spec.ts` is the source of truth for:

- `id`
- `containerRules`
- `decoder` (schema-first)

## Decoder Model
Use `decoder: { kind: "schema", schema: ... }` by default.

Available schema sources include:

- `frontmatter` keys
- top-level Markdown AST selectors (`heading`, `paragraph`, `listItems`)
- `contentMarkdown`
- fenced containers (`container`, `containers`)
- `custom` source resolver (escape hatch inside schema)

Use `decoder: { kind: "custom", decode }` only when schema sources are not enough.

## Fenced Containers
Container rules still define expected container kinds/counts and warnings:

- Example: `::: column` for `two-column`
- No nested containers in v1

The decode engine validates counts and emits warnings without blocking rendering.

## Minimal Example
```ts
import type { SlideContainerRule, SlideTemplateDefinition } from "../../types";
import type { MarkdownTemplateProps } from "../shared";
import { markdownTemplateDecoder } from "../shared";

export const exampleContainerRules: readonly SlideContainerRule[] = [];

export const exampleTemplateDefinition: SlideTemplateDefinition<MarkdownTemplateProps> = {
  id: "example-layout",
  containerRules: exampleContainerRules,
  decoder: markdownTemplateDecoder
};
```
