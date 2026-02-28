import { BasicMarkdown } from "../../markdown/basic-markdown";
import type { MarkdownTemplateProps } from "../shared";
import type { SlideTemplateSlots } from "../../ui-types";

export function QuoteFocusTemplate(
  { markdown }: MarkdownTemplateProps,
  slots: SlideTemplateSlots = {}
) {
  const content = (
    <div className="relative grid h-full place-items-center">
      <span className="pointer-events-none absolute left-8 top-0 text-[240px] font-semibold leading-none text-zinc-200/70">
        “
      </span>
      <div className="max-w-[1400px] rounded-3xl border border-zinc-200 bg-zinc-50/70 px-16 py-14">
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
