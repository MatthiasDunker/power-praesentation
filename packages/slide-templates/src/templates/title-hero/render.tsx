import type { TitleHeroTemplateProps } from "./decode";

export function TitleHeroTemplate({
  overline,
  title,
  text,
}: TitleHeroTemplateProps) {
  return (
    <div className={`page size-large tint-bgc-full tint-c-text`}>
      <div className="the-grid grid grid-cols-9 grid-rows-5 gap-gutter">
        <div
          className={`flex flex-col col-start-1 col-span-full row-start-1 row-span-4 justify-center ${
            "items-start"
            // centered ? "items-center" : "items-start"
          }`}
        >
          {!!overline && <p className="typo-overline">{overline}</p>}
          <h1 className="typo-display text-balance whitespace-pre-wrap">
            {title}
          </h1>
          {!!text && (
            <div className="grid grid-cols-9 gap-gutter pt-gutter h-2">
              <p className="typo-body size-medium whitespace-pre-wrap col-start-1 col-span-2 tint-c-subtle">
                {text}
              </p>
            </div>
          )}
        </div>
        {/* {afterGrid} */}
      </div>
    </div>
  );
}
