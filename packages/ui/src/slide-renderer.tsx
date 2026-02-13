import type { SlideDocument } from "@power/contracts";
import { BasicMarkdown } from "./basic-markdown";

interface SlideRendererProps {
  slide: SlideDocument;
}

function stripFrontmatter(markdown: string): string {
  if (!markdown.startsWith("---\n")) {
    return markdown;
  }

  const lines = markdown.replace(/\r\n?/g, "\n").split("\n");
  const endIndex = lines.slice(1).findIndex((line) => line.trim() === "---");
  if (endIndex === -1) {
    return markdown;
  }

  return lines.slice(endIndex + 2).join("\n").trim();
}

function baseContent(slide: SlideDocument): string {
  return stripFrontmatter(slide.rawMarkdown);
}

function templateTextClassName() {
  return "h-full w-full p-16 text-zinc-900 [&_h1]:mb-6 [&_h1]:text-[72px] [&_h1]:leading-tight [&_h2]:mb-4 [&_h2]:text-[48px] [&_h2]:leading-tight [&_p]:text-[32px] [&_p]:leading-snug [&_ul]:pl-10 [&_li]:text-[30px] [&_li]:leading-snug";
}

function renderTwoColumn(slide: SlideDocument) {
  const columns = slide.containers.filter((container) => container.kind === "column");
  const left = columns[0]?.markdown ?? "";
  const right = columns[1]?.markdown ?? "";

  return (
    <div className="grid h-full grid-cols-2 gap-6">
      <div className="rounded-md border border-zinc-200 bg-zinc-50 p-6">
        <BasicMarkdown markdown={left} />
      </div>
      <div className="rounded-md border border-zinc-200 bg-zinc-50 p-6">
        <BasicMarkdown markdown={right} />
      </div>
    </div>
  );
}

export function SlideRenderer({ slide }: SlideRendererProps) {
  const content = baseContent(slide);
  const baseTemplateClass = templateTextClassName();

  switch (slide.layout) {
    case "title-hero":
      return (
        <section className={`${baseTemplateClass} flex flex-col justify-center`}>
          <BasicMarkdown markdown={content} />
        </section>
      );
    case "section-divider":
      return (
        <section className={`${baseTemplateClass} grid place-content-center text-center`}>
          <BasicMarkdown markdown={content} />
        </section>
      );
    case "two-column":
      return <section className={baseTemplateClass}>{renderTwoColumn(slide)}</section>;
    case "quote-focus":
      return (
        <section className={`${baseTemplateClass} [&_p]:text-[44px] [&_p]:italic`}>
          <BasicMarkdown markdown={content} />
        </section>
      );
    case "image-left-copy":
      return (
        <section className={`${baseTemplateClass} grid grid-cols-[44%_56%] gap-6`}>
          <div className="rounded-md border border-zinc-200 bg-zinc-100" />
          <div className="self-center">
            <BasicMarkdown markdown={content} />
          </div>
        </section>
      );
    case "image-right-copy":
      return (
        <section className={`${baseTemplateClass} grid grid-cols-[56%_44%] gap-6`}>
          <div className="self-center">
            <BasicMarkdown markdown={content} />
          </div>
          <div className="rounded-md border border-zinc-200 bg-zinc-100" />
        </section>
      );
    case "metric-highlight":
      return (
        <section className={`${baseTemplateClass} [&_h2]:text-[62px] [&_li]:text-[36px]`}>
          <BasicMarkdown markdown={content} />
        </section>
      );
    case "bullet-list":
    default:
      return (
        <section className={baseTemplateClass}>
          <BasicMarkdown markdown={content} />
        </section>
      );
  }
}
