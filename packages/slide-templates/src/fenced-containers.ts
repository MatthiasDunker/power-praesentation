import { parseMarkdownAst } from "./markdown-ast";
import { toLines } from "./frontmatter";
import type { SlideAstContainerNode } from "./types";

interface ActiveContainer {
  kind: string;
  lines: string[];
  lineStart: number;
}

export interface ParseFencedContainersResult {
  containers: SlideAstContainerNode[];
  contentMarkdown: string;
  warnings: string[];
}

export function parseFencedContainers(markdown: string): ParseFencedContainersResult {
  const lines = toLines(markdown);
  const containers: SlideAstContainerNode[] = [];
  const warnings: string[] = [];
  const contentLines: string[] = [];

  let activeContainer: ActiveContainer | null = null;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const trimmed = line.trim();
    const openMatch = trimmed.match(/^:::\s*([a-zA-Z0-9_-]+)\s*$/);
    const isClose = trimmed === ":::";

    if (openMatch) {
      if (activeContainer) {
        warnings.push("Nested fenced containers are not supported in v1.");
        activeContainer.lines.push(line);
        continue;
      }

      activeContainer = {
        kind: openMatch[1],
        lines: [],
        lineStart: index + 1
      };
      continue;
    }

    if (isClose) {
      if (!activeContainer) {
        warnings.push("Found closing fenced container without opening tag.");
        continue;
      }

      const containerMarkdown = activeContainer.lines.join("\n").trim();
      containers.push({
        type: "fenced_container",
        kind: activeContainer.kind,
        markdown: containerMarkdown,
        ast: parseMarkdownAst(containerMarkdown),
        lineStart: activeContainer.lineStart,
        lineEnd: index + 1
      });
      activeContainer = null;
      continue;
    }

    if (activeContainer) {
      activeContainer.lines.push(line);
      continue;
    }

    contentLines.push(line);
  }

  if (activeContainer) {
    warnings.push(`Unclosed fenced container '${activeContainer.kind}'.`);
    const containerMarkdown = activeContainer.lines.join("\n").trim();
    containers.push({
      type: "fenced_container",
      kind: activeContainer.kind,
      markdown: containerMarkdown,
      ast: parseMarkdownAst(containerMarkdown),
      lineStart: activeContainer.lineStart,
      lineEnd: lines.length
    });
  }

  return {
    containers,
    contentMarkdown: contentLines.join("\n").trim(),
    warnings
  };
}
