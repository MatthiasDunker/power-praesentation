import type { SlideDocument, SlideLayoutId } from "@power/contracts";
import { parseFencedContainers } from "./fenced-containers";
import { parseFrontmatter } from "./frontmatter";
import { parseMarkdownAst } from "./markdown-ast";
import type { SlideAstInput } from "./types";

interface SlideAstInputFromMarkdownOptions {
  layout: SlideLayoutId;
  markdown: string;
  frontmatter?: Record<string, string>;
}

export interface SlideAstInputFromMarkdownResult {
  input: SlideAstInput;
  warnings: string[];
}

export function createSlideAstInputFromMarkdown({
  layout,
  markdown,
  frontmatter = {}
}: SlideAstInputFromMarkdownOptions): SlideAstInputFromMarkdownResult {
  const parsedFrontmatter = parseFrontmatter(markdown);
  const mergedFrontmatter = {
    ...parsedFrontmatter.frontmatter,
    ...frontmatter
  };
  const containerParse = parseFencedContainers(parsedFrontmatter.bodyMarkdown);

  return {
    input: {
      layout,
      frontmatter: mergedFrontmatter,
      bodyMarkdown: parsedFrontmatter.bodyMarkdown,
      contentMarkdown: containerParse.contentMarkdown,
      ast: parseMarkdownAst(containerParse.contentMarkdown),
      containers: containerParse.containers
    },
    warnings: containerParse.warnings
  };
}

export function createSlideAstInputFromDocument(slide: SlideDocument): SlideAstInput {
  const parseResult = createSlideAstInputFromMarkdown({
    layout: slide.layout,
    markdown: slide.rawMarkdown,
    frontmatter: slide.resolvedFrontmatter
  });

  return parseResult.input;
}
