import { unified } from "unified";
import remarkParse from "remark-parse";
import type { MarkdownAstRoot } from "./types";

const markdownParser = unified().use(remarkParse);

export function parseMarkdownAst(markdown: string): MarkdownAstRoot {
  return markdownParser.parse(markdown) as MarkdownAstRoot;
}
