import type { SlideDiagnostic } from "@power/contracts";
import { parseMarkdownAst } from "./markdown-ast";
import { toLines } from "./frontmatter";
import type { ContainerParams, SlideAstContainerNode } from "./types";

interface ActiveContainer {
  kind: string;
  params?: ContainerParams;
  lines: string[];
  lineStart: number;
  nestedDepth: number;
}

export interface ParsedFencedContainerOpenLine {
  kind: string;
  params?: ContainerParams;
}

function parseContainerParams(value: string | undefined): ContainerParams | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const tokens = value
    .trim()
    .split(/\s+/)
    .filter((token) => token.length > 0);
  if (tokens.length === 0) {
    return undefined;
  }

  const flags: string[] = [];
  const attributes: Record<string, string> = {};

  for (const token of tokens) {
    const separatorIndex = token.indexOf("=");
    if (separatorIndex > 0) {
      const key = token.slice(0, separatorIndex).trim().toLowerCase();
      if (key.length === 0) {
        continue;
      }

      attributes[key] = token.slice(separatorIndex + 1);
      continue;
    }

    flags.push(token.toLowerCase());
  }

  return {
    tokens,
    flags,
    attributes
  };
}

export function parseFencedContainerOpenLine(
  value: string
): ParsedFencedContainerOpenLine | null {
  const trimmed = value.trim();
  const openMatch = trimmed.match(/^:::\s*([a-zA-Z0-9_-]+)(?:\s+(.+))?$/);

  if (!openMatch) {
    return null;
  }

  return {
    kind: openMatch[1],
    params: parseContainerParams(openMatch[2])
  };
}

export interface ParseFencedContainersResult {
  containers: SlideAstContainerNode[];
  contentMarkdown: string;
  diagnostics: SlideDiagnostic[];
}

export function parseFencedContainers(markdown: string): ParseFencedContainersResult {
  const lines = toLines(markdown);
  const containers: SlideAstContainerNode[] = [];
  const diagnostics: SlideDiagnostic[] = [];
  const contentLines: string[] = [];

  let activeContainer: ActiveContainer | null = null;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const trimmed = line.trim();
    const openLine = parseFencedContainerOpenLine(trimmed);
    const isClose = trimmed === ":::";

    if (openLine) {
      if (activeContainer) {
        activeContainer.lines.push(line);
        activeContainer.nestedDepth += 1;
        continue;
      }

      activeContainer = {
        kind: openLine.kind,
        params: openLine.params,
        lines: [],
        lineStart: index + 1,
        nestedDepth: 0
      };
      continue;
    }

    if (isClose) {
      if (!activeContainer) {
        diagnostics.push({
          severity: "warning",
          message: "Found closing fenced container without opening tag.",
          code: "orphan_container_close"
        });
        continue;
      }

      if (activeContainer.nestedDepth > 0) {
        activeContainer.nestedDepth -= 1;
        activeContainer.lines.push(line);
        continue;
      }

      const containerMarkdown = activeContainer.lines.join("\n").trim();
      containers.push({
        type: "fenced_container",
        kind: activeContainer.kind,
        params: activeContainer.params,
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
    diagnostics.push({
      severity: "warning",
      message: `Unclosed fenced container '${activeContainer.kind}'.`,
      code: "unclosed_fenced_container",
      field: activeContainer.kind
    });
    const containerMarkdown = activeContainer.lines.join("\n").trim();
    containers.push({
      type: "fenced_container",
      kind: activeContainer.kind,
      params: activeContainer.params,
      markdown: containerMarkdown,
      ast: parseMarkdownAst(containerMarkdown),
      lineStart: activeContainer.lineStart,
      lineEnd: lines.length
    });
  }

  return {
    containers,
    contentMarkdown: contentLines.join("\n").trim(),
    diagnostics
  };
}
