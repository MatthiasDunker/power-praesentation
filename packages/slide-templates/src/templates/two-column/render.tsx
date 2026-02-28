import { BasicMarkdown } from "../../markdown/basic-markdown";
import type { TwoColumnTemplateProps } from "../shared";

export function TwoColumnTemplate({
  leftMarkdown,
  rightMarkdown
}: TwoColumnTemplateProps) {
  return (
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
}
