import { BasicMarkdown } from "../../markdown/basic-markdown";
import type { TwoColumnTemplateProps } from "../shared";
import type { SlideTemplateSlots } from "../../ui-types";

export function TwoColumnTemplate({
  title,
  lead,
  leftColumn,
  rightColumn
}: TwoColumnTemplateProps, slots: SlideTemplateSlots = {}) {
  const content = (
    <div className="grid h-full grid-rows-[auto_auto_minmax(0,1fr)] gap-6">
      <div className="space-y-4">
        <h1 className="text-balance">{title}</h1>
        {lead ? <p className="text-zinc-700 whitespace-pre-wrap">{lead}</p> : null}
      </div>
      <div className="grid h-full min-h-0 grid-cols-2 gap-6">
        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6">
          <BasicMarkdown markdown={leftColumn} />
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6">
          <BasicMarkdown markdown={rightColumn} />
        </div>
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
