import type { SlideAstInput, SlideDecodeResult } from "../types";

export interface MarkdownTemplateProps {
  markdown: string;
}

export interface TwoColumnTemplateProps {
  leftMarkdown: string;
  rightMarkdown: string;
}

export const baseTemplateRootClassName =
  "h-full w-full p-16 text-zinc-900 [&_h1]:mb-6 [&_h1]:text-[72px] [&_h1]:leading-tight [&_h2]:mb-4 [&_h2]:text-[48px] [&_h2]:leading-tight [&_p]:text-[32px] [&_p]:leading-snug [&_ul]:pl-10 [&_li]:text-[30px] [&_li]:leading-snug";

export function decodeMarkdownTemplate(
  input: SlideAstInput
): SlideDecodeResult<MarkdownTemplateProps> {
  return {
    props: {
      markdown: input.contentMarkdown
    },
    warnings: []
  };
}

export function decodeTwoColumnTemplate(
  input: SlideAstInput
): SlideDecodeResult<TwoColumnTemplateProps> {
  const warnings: string[] = [];
  const columns = input.containers.filter((container) => container.kind === "column");

  if (columns.length === 0) {
    warnings.push("Layout 'two-column' expects 2 '::: column' containers, found 0.");
  }

  if (columns.length === 1) {
    warnings.push("Layout 'two-column' expects 2 '::: column' containers, found 1.");
  }

  if (columns.length > 2) {
    warnings.push("Layout 'two-column' received more than 2 columns. Extra columns are ignored.");
  }

  return {
    props: {
      leftMarkdown: columns[0]?.markdown ?? "",
      rightMarkdown: columns[1]?.markdown ?? ""
    },
    warnings
  };
}
