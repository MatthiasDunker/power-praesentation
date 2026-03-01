import { BasicMarkdown } from "../../markdown/basic-markdown";
import type { TwoColumnTemplateProps } from "../shared";
import type { SlideTemplateSlots } from "../../ui-types";

export function TwoColumnTemplate(
  { title, lead, leftColumn, rightColumn, className }: TwoColumnTemplateProps,
  slots: SlideTemplateSlots = {},
) {
  const content = (
    <div className="grid grid-cols-9 grid-rows-5 gap-gutter">
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

  return (
    <div
      className={[`page tint-bgc-full tint-c-text`, className]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="the-grid flex flex-col justify-between">
        {(!!title || !!lead) && (
          <div className="mb-gutter flex flex-col">
            {!!title && (
              <h1
                className={`typo-display size-large text-balance whitespace-pre-wrap`}
              >
                {title}
              </h1>
            )}
            {!!lead && (
              <p
                className={
                  "typo-body size-large whitespace-pre-wrap tint-c-subtle w-5/9" +
                  (!!title ? " mt-gutter" : "")
                }
              >
                {lead}
              </p>
            )}
          </div>
        )}
        <div>
          <div className="flex gap-gutter">
            {[leftColumn, rightColumn].map((column, index) => (
              <div
                key={index}
                className={
                  "basis-1/3 grow space-y-[var(--spacing-gutter)]" +
                  (index === 0 ? " pr-1/8" : "")
                }
              >
                <BasicMarkdown markdown={column} />
              </div>
            ))}
          </div>
          {!!slots.footer && (
            <div className="shrink-0 self-end mt-gutter">{slots.footer}</div>
          )}
        </div>
      </div>
    </div>
  );
}
