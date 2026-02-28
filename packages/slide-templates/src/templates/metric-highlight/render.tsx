import { BasicMarkdown } from "../../markdown/basic-markdown";
import type { MarkdownTemplateProps } from "../shared";
import type { SlideTemplateSlots } from "../../ui-types";

export function MetricHighlightTemplate(
  { markdown }: MarkdownTemplateProps,
  slots: SlideTemplateSlots = {}
) {
  const content = (
    <div className="grid h-full grid-rows-[auto_1fr] gap-8">
      <div className="grid grid-cols-[1fr_260px] gap-4">
        <div className="rounded-2xl border border-zinc-900 bg-zinc-900 px-8 py-6 text-zinc-100">
          <p className="text-sm uppercase tracking-[0.2em] text-zinc-300">Primary KPI</p>
          <p className="mt-2 text-6xl font-semibold leading-none">+24%</p>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-6 py-6 text-zinc-700">
          <p className="text-sm uppercase tracking-[0.2em] text-zinc-500">Confidence</p>
          <p className="mt-2 text-3xl font-semibold">High</p>
        </div>
      </div>
      <div className="rounded-2xl border border-zinc-200 bg-white px-8 py-7">
        <BasicMarkdown markdown={markdown} />
      </div>
    </div>
  );

  if (!slots.footer) {
    return content;
  }

  return (
    <div className="grid h-full grid-rows-[minmax(0,1fr)_auto] gap-4">
      <div className="min-h-0">{content}</div>
      <div>{slots.footer}</div>
    </div>
  );
}
