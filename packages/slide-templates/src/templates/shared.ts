import type { SlideTemplateDecoder } from "../types";

export interface MarkdownTemplateProps {
  markdown: string;
}

export type ColumnAlign = "top" | "center" | "bottom";
export type ContentSize = "small" | "medium" | "large";

export interface TwoColumnTemplateProps {
  title: string;
  lead?: string;
  leftColumn: string;
  rightColumn: string;
  columnAlign: ColumnAlign;
  contentSize: ContentSize;
  className?: string;
}

export interface MultiColumnTemplateProps {
  title: string;
  lead?: string;
  columns: string[];
  columnAlign: ColumnAlign;
  contentSize: ContentSize;
  className?: string;
}

export function toColumnAlign(value: unknown): ColumnAlign {
  if (typeof value !== "string") {
    return "top";
  }

  const normalized = value.trim().toLowerCase();

  if (normalized === "center") {
    return "center";
  }

  if (normalized === "bottom") {
    return "bottom";
  }

  return "top";
}

export function toColumnAlignItemsClass(value: ColumnAlign | undefined): string {
  if (value === "center") {
    return "items-center";
  }

  if (value === "bottom") {
    return "items-end";
  }

  return "items-start";
}

export function toContentSize(value: unknown): ContentSize {
  if (typeof value !== "string") {
    return "medium";
  }

  const normalized = value.trim().toLowerCase();

  if (normalized === "small") {
    return "small";
  }

  if (normalized === "large") {
    return "large";
  }

  return "medium";
}

export function toContentSizeClass(value: ContentSize | undefined): string {
  if (value === "small") {
    return "size-small";
  }

  if (value === "large") {
    return "size-large";
  }

  return "size-medium";
}

export const baseTemplateRootClassName =
  "h-full w-full p-16 text-zinc-900 [&_h1]:mb-6 [&_h1]:text-[72px] [&_h1]:leading-tight [&_h2]:mb-4 [&_h2]:text-[48px] [&_h2]:leading-tight [&_p]:text-[32px] [&_p]:leading-snug [&_ul]:pl-10 [&_li]:text-[30px] [&_li]:leading-snug";

export const markdownTemplateDecoder: SlideTemplateDecoder<MarkdownTemplateProps> =
  {
    kind: "schema",
    schema: {
      fields: {
        markdown: {
          sources: [{ kind: "contentMarkdown" }],
          default: "",
        },
      },
    },
  };
