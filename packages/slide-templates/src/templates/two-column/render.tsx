import { BasicMarkdown } from "../../markdown/basic-markdown";
import type { TwoColumnTemplateProps } from "../shared";
import { toColumnAlignItemsClass, toContentSizeClass } from "../shared";
import type { SlideTemplateSlots } from "../../ui-types";

export function TwoColumnTemplate(
  {
    title,
    lead,
    leftColumn,
    rightColumn,
    columnAlign = "top",
    contentSize = "medium",
    className,
  }: TwoColumnTemplateProps,
  slots: SlideTemplateSlots = {},
) {
  const columnAlignClass = toColumnAlignItemsClass(columnAlign);
  const contentSizeClass = toContentSizeClass(contentSize);
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
                  "typo-body size-large whitespace-pre-wrap tint-c-subtle w-4/9" +
                  (!!title ? " mt-gutter" : "")
                }
              >
                {lead}
              </p>
            )}
          </div>
        )}
        <div>
          <div className={["flex gap-gutter", columnAlignClass, contentSizeClass].join(" ")}>
            {[leftColumn, rightColumn].map((column, index) => (
              <div
                key={index}
                className={"basis-1/3 grow space-y-[var(--spacing-gutter)]"}
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
