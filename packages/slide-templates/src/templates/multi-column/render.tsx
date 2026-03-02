import type { CSSProperties } from "react";
import { BasicMarkdown } from "../../markdown/basic-markdown";
import type { SlideTemplateSlots } from "../../ui-types";
import type { MultiColumnTemplateProps } from "../shared";
import { toColumnAlignItemsClass, toContentSizeClass } from "../shared";

export function MultiColumnTemplate(
  {
    title,
    lead,
    columns,
    columnAlign = "top",
    contentSize = "medium",
    className,
  }: MultiColumnTemplateProps,
  slots: SlideTemplateSlots = {},
) {
  const columnAlignClass = toColumnAlignItemsClass(columnAlign);
  const contentSizeClass = toContentSizeClass(contentSize);
  const normalizedColumns = Array.isArray(columns) ? columns : [];
  const gridTemplateColumns =
    normalizedColumns.length > 0
      ? `repeat(${normalizedColumns.length}, minmax(0, 1fr))`
      : undefined;

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
          <div
            className={["grid gap-gutter", columnAlignClass, contentSizeClass].join(
              " ",
            )}
            style={
              {
                gridTemplateColumns,
              } as CSSProperties
            }
          >
            {normalizedColumns.map((column, index) => (
              <div
                key={index}
                className={"min-w-0 space-y-[var(--spacing-gutter)]"}
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
