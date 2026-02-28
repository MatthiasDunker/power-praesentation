import { BasicMarkdown } from "../../markdown/basic-markdown";
import type { TwoColumnTemplateProps } from "../shared";
import type { SlideTemplateSlots } from "../../ui-types";

export function TwoColumnTemplate({
  leftMarkdown,
  rightMarkdown
}: TwoColumnTemplateProps, slots: SlideTemplateSlots = {}) {
  const content = (
    <div className="grid h-full grid-cols-2 gap-6">
      <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
          Option A
        </p>
        <BasicMarkdown markdown={leftMarkdown} />
      </div>
      <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
          Option B
        </p>
        <BasicMarkdown markdown={rightMarkdown} />
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
