import type { SlideTemplateDecoder } from "../types";

export interface MarkdownTemplateProps {
  markdown: string;
}

export interface TwoColumnTemplateProps {
  leftMarkdown: string;
  rightMarkdown: string;
}

export const baseTemplateRootClassName =
  "h-full w-full p-16 text-zinc-900 [&_h1]:mb-6 [&_h1]:text-[72px] [&_h1]:leading-tight [&_h2]:mb-4 [&_h2]:text-[48px] [&_h2]:leading-tight [&_p]:text-[32px] [&_p]:leading-snug [&_ul]:pl-10 [&_li]:text-[30px] [&_li]:leading-snug";

export const markdownTemplateDecoder: SlideTemplateDecoder<MarkdownTemplateProps> = {
  kind: "schema",
  schema: {
    fields: {
      markdown: {
        sources: [{ kind: "contentMarkdown" }],
        default: ""
      }
    }
  }
};

export const twoColumnTemplateDecoder: SlideTemplateDecoder<TwoColumnTemplateProps> = {
  kind: "schema",
  schema: {
    fields: {
      leftMarkdown: {
        sources: [{ kind: "container", containerKind: "column", index: 0 }],
        default: ""
      },
      rightMarkdown: {
        sources: [{ kind: "container", containerKind: "column", index: 1 }],
        default: ""
      }
    }
  }
};
