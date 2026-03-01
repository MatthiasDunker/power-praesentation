import type { SlideDiagnostic, SlideLayoutId } from "@power/contracts";

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
  diagnostics: SlideDiagnostic[];
}

export interface SlideDecodeContext {
  input: SlideAstInput;
  headings: Array<{ depth: 1 | 2 | 3 | 4 | 5 | 6; text: string }>;
  paragraphs: string[];
  listItems: string[];
  containersByKind: Record<string, string[]>;
}

export type SlideDecodeSource =
  | {
      kind: "frontmatter";
      key: string;
      nonEmpty?: boolean;
    }
  | {
      kind: "contentMarkdown";
      nonEmpty?: boolean;
    }
  | {
      kind: "heading";
      depth: 1 | 2 | 3 | 4 | 5 | 6;
      index?: number;
      nonEmpty?: boolean;
    }
  | {
      kind: "paragraph";
      index?: number;
      nonEmpty?: boolean;
    }
  | {
      kind: "paragraphs";
    }
  | {
      kind: "listItems";
    }
  | {
      kind: "container";
      containerKind: string;
      index?: number;
      nonEmpty?: boolean;
    }
  | {
      kind: "containers";
      containerKind: string;
    }
  | {
      kind: "literal";
      value: unknown;
    }
  | {
      kind: "custom";
      resolve: (context: SlideDecodeContext) => unknown;
    };

export interface SlideDecodeSchemaField<TValue = unknown> {
  sources: readonly SlideDecodeSource[];
  transform?: (value: unknown, context: SlideDecodeContext) => TValue;
  default?: TValue | ((context: SlideDecodeContext) => TValue);
  missingPolicy?: "none" | "warning" | "error";
  required?: boolean;
}

export interface SlideDecodeSchema<TProps = unknown> {
  fields: Record<string, SlideDecodeSchemaField<unknown>>;
}

export type SlideTemplateDecoder<TProps = unknown> =
  | {
      kind: "schema";
      schema: SlideDecodeSchema<TProps>;
    }
  | {
      kind: "custom";
      decode: (input: SlideAstInput) => SlideDecodeResult<TProps>;
    };

export interface SlideContainerRule {
  kind: string;
  min: number;
  max: number;
}

export interface SlideTemplateDefinition<TProps = unknown> {
  id: SlideLayoutId;
  containerRules: readonly SlideContainerRule[];
  decoder: SlideTemplateDecoder<TProps>;
}

export type SlideTemplateRegistry = Record<string, SlideTemplateDefinition<unknown>>;
