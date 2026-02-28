import { BasicMarkdown } from "../../markdown/basic-markdown";
import type { MarkdownTemplateProps } from "../shared";
import type { SlideTemplateSlots } from "../../ui-types";

export function ImageLeftCopyTemplate(
  { markdown }: MarkdownTemplateProps,
  slots: SlideTemplateSlots = {}
) {
  return (
    <>
      <div className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-gradient-to-br from-zinc-200 via-zinc-100 to-zinc-50">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.9),transparent_55%)]" />
        <p className="absolute bottom-5 left-5 rounded-full bg-white/80 px-4 py-1 text-sm font-medium text-zinc-600 backdrop-blur">
          Visual placeholder
        </p>
      </div>
      <div className="self-center rounded-2xl border border-zinc-200 bg-white px-8 py-7">
        <BasicMarkdown markdown={markdown} />
      </div>
      {slots.footer ? <div className="col-span-full pt-2">{slots.footer}</div> : null}
    </>
  );
}
