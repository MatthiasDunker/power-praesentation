import ReactMarkdown from "react-markdown";
import { InfoBox } from "./info-box";
import { DividerList } from "./divider-list";
import Paragraph from "./components/paragraph";
import List from "./components/list";
import ListItem from "./components/list-item";
import Headline from "./components/headline";
import { parseFencedContainerOpenLine } from "../fenced-containers";
import type { ContainerParams } from "../types";

interface BasicMarkdownProps {
  markdown: string;
}

type MarkdownBlockKind = "infoBox" | "divivderList";

interface MarkdownSegment {
  kind: "markdown" | MarkdownBlockKind;
  markdown: string;
  params?: ContainerParams;
}

const fencedSegmentKindByContainerKind: Record<string, MarkdownBlockKind> = {
  infoBox: "infoBox",
  dividerList: "divivderList",
  divivderList: "divivderList",
};

function trimOuterBlankLines(lines: string[]): string[] {
  let start = 0;
  let end = lines.length;

  while (start < end && lines[start].trim().length === 0) {
    start += 1;
  }

  while (end > start && lines[end - 1].trim().length === 0) {
    end -= 1;
  }

  return lines.slice(start, end);
}

function pushMarkdownSegment(segments: MarkdownSegment[], lines: string[]) {
  const normalized = trimOuterBlankLines(lines);
  const value = normalized.join("\n");

  if (value.trim().length === 0) {
    return;
  }

  segments.push({
    kind: "markdown",
    markdown: value,
  });
}

export function parseBasicMarkdownSegments(
  markdown: string,
): MarkdownSegment[] {
  const segments: MarkdownSegment[] = [];
  const lines = markdown.replace(/\r\n?/g, "\n").split("\n");
  const markdownLines: string[] = [];
  let activeContainer: {
    kind: MarkdownBlockKind;
    params?: ContainerParams;
    openLine: string;
    lines: string[];
  } | null = null;

  for (const line of lines) {
    const trimmed = line.trim();

    if (activeContainer) {
      if (trimmed === ":::") {
        const containerMarkdown = trimOuterBlankLines(
          activeContainer.lines,
        ).join("\n");
        segments.push({
          kind: activeContainer.kind,
          params: activeContainer.params,
          markdown:
            containerMarkdown.trim().length === 0 ? "" : containerMarkdown,
        });
        activeContainer = null;
        continue;
      }

      activeContainer.lines.push(line);
      continue;
    }

    const openLine = parseFencedContainerOpenLine(trimmed);
    const segmentKind = openLine
      ? fencedSegmentKindByContainerKind[openLine.kind]
      : undefined;

    if (segmentKind) {
      pushMarkdownSegment(segments, markdownLines);
      markdownLines.length = 0;
      activeContainer = {
        kind: segmentKind,
        params: openLine?.params,
        openLine: line,
        lines: []
      };
      continue;
    }

    markdownLines.push(line);
  }

  if (activeContainer) {
    markdownLines.push(activeContainer.openLine, ...activeContainer.lines);
  }

  pushMarkdownSegment(segments, markdownLines);

  return segments;
}

export function BasicMarkdown({ markdown }: BasicMarkdownProps) {
  const segments = parseBasicMarkdownSegments(markdown);

  if (segments.length === 0) {
    return null;
  }

  return (
    <>
      {segments.map((segment, index) => {
        if (segment.kind === "infoBox") {
          const isStretch = segment.params?.flags.includes("stretch") ?? false;
          return (
            <InfoBox
              key={`info-box-${index}`}
              markdown={segment.markdown}
              stretch={isStretch}
            />
          );
        }

        if (segment.kind === "divivderList") {
          return (
            <DividerList
              key={`divider-list-${index}`}
              markdown={segment.markdown}
            />
          );
        }

        return (
          <ReactMarkdown
            components={{
              h2: Headline,
              p: Paragraph,
              ul: List,
              li: ListItem,
            }}
            key={`markdown-${index}`}
            skipHtml
          >
            {segment.markdown}
          </ReactMarkdown>
        );
      })}
    </>
  );
}
