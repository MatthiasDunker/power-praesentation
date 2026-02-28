import type { SlideLayoutId } from "@power/contracts";

export interface MarkdownAstRoot {
  type: string;
  children: unknown[];
  [key: string]: unknown;
}

export interface SlideAstContainerNode {
  type: "fenced_container";
  kind: string;
  markdown: string;
  ast: MarkdownAstRoot;
  lineStart: number;
  lineEnd: number;
}

export interface SlideAstInput {
  layout: SlideLayoutId;
  frontmatter: Record<string, string>;
  frontmatterData: Record<string, unknown>;
  bodyMarkdown: string;
  contentMarkdown: string;
  ast: MarkdownAstRoot;
  containers: SlideAstContainerNode[];
}

export interface SlideDecodeResult<TProps> {
  props: TProps;
  warnings: string[];
}

export interface SlideContainerRule {
  kind: string;
  min: number;
  max: number;
}

export interface SlideTemplateDefinition<TProps = unknown> {
  id: SlideLayoutId;
  containerRules: readonly SlideContainerRule[];
  decode: (input: SlideAstInput) => SlideDecodeResult<TProps>;
}

export type SlideTemplateRegistry = Record<string, SlideTemplateDefinition<unknown>>;
