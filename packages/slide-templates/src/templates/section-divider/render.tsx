import { BasicMarkdown } from "../../markdown/basic-markdown";
import type { MarkdownTemplateProps } from "../shared";

export function SectionDividerTemplate({ markdown }: MarkdownTemplateProps) {
  return (
    <div className="grid h-full grid-rows-[1fr_auto_1fr]">
      <div className="self-end pb-8">
        <span className="inline-block h-px w-56 bg-zinc-300" />
      </div>
      <div className="rounded-2xl border border-zinc-200 bg-zinc-50/60 px-14 py-10 shadow-[0_20px_50px_-40px_rgba(0,0,0,0.45)]">
        <BasicMarkdown markdown={markdown} />
      </div>
      <div className="self-start pt-8 text-right">
        <span className="ml-auto inline-block h-px w-56 bg-zinc-300" />
      </div>
    </div>
  );
}
