import type { SlideDocument, SlideLayoutId } from "@power/contracts";
import { createSlideAstInputFromDocument, decodeSlideTemplate } from "@power/slide-templates";
import {
  createCoreTemplateModuleRegistry,
  resolveTemplateSlots,
  type SlideTemplateModule,
  type SlideTemplateModuleRegistry
} from "@power/slide-templates/ui";

export interface SlideRendererProps {
  slide: SlideDocument;
  registry?: SlideTemplateModuleRegistry;
  slideNumber?: number;
  slideCount?: number;
}

const fallbackLayout: SlideLayoutId = "bullet-list";
const unknownLayoutWarnings = new Set<string>();

function extractSlideTitle(rawMarkdown: string): string {
  const withoutFrontmatter = rawMarkdown.startsWith("---\n")
    ? rawMarkdown.replace(/^---\n[\s\S]*?\n---\n?/, "")
    : rawMarkdown;
  const heading = withoutFrontmatter
    .split(/\r?\n/)
    .find((line) => line.trim().startsWith("# "))
    ?.trim()
    .slice(2);

  return heading ?? "Untitled";
}

function normalizeThemeClassName(themeValue: string | undefined): string | null {
  if (!themeValue) {
    return null;
  }

  const trimmed = themeValue.trim();
  if (trimmed.length === 0) {
    return null;
  }

  return trimmed.startsWith("theme-") ? trimmed : `theme-${trimmed}`;
}

export function createSlideRendererRegistry(
  extensions: ReadonlyArray<SlideTemplateModule<unknown>> = []
): SlideTemplateModuleRegistry {
  return createCoreTemplateModuleRegistry(extensions);
}

const defaultRegistry = createSlideRendererRegistry();

function resolveTemplate(
  layout: SlideLayoutId,
  registry: SlideTemplateModuleRegistry
): SlideTemplateModule<unknown> | null {
  const exact = registry[layout];
  if (exact) {
    return exact;
  }

  if (!unknownLayoutWarnings.has(layout)) {
    unknownLayoutWarnings.add(layout);
    console.warn(
      `[SlideRenderer] Unknown layout '${layout}'. Falling back to '${fallbackLayout}'.`
    );
  }

  return registry[fallbackLayout] ?? null;
}

export function SlideRenderer({
  slide,
  registry = defaultRegistry,
  slideNumber,
  slideCount
}: SlideRendererProps) {
  const template = resolveTemplate(slide.layout, registry);

  if (!template) {
    return null;
  }

  const astInput = createSlideAstInputFromDocument(slide);
  const slideDiagnostics = slide.diagnostics ?? [];
  const errorDiagnostics = slideDiagnostics.filter(
    (diagnostic) => diagnostic.severity === "error"
  );
  const themeClassName = normalizeThemeClassName(astInput.frontmatter.theme);
  const sectionClassName = [template.rootClassName, themeClassName]
    .filter((value) => typeof value === "string" && value.length > 0)
    .join(" ");

  if (errorDiagnostics.length > 0) {
    return (
      <section
        className={sectionClassName}
        data-power-slide-layout={slide.layout}
        data-power-slide-root
      >
        <div className="grid h-full place-items-center">
          <div className="w-full rounded-2xl border border-red-200 bg-red-50 p-12 text-red-950">
            <h1 className="mb-6 text-balance">Unable to render: {extractSlideTitle(slide.rawMarkdown)}</h1>
            <ul className="space-y-3 pl-8 text-2xl leading-snug">
              {errorDiagnostics.map((diagnostic, index) => (
                <li key={`${diagnostic.message}-${index}`}>{diagnostic.message}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    );
  }

  const decodeResult = decodeSlideTemplate(template, astInput);
  const slots = resolveTemplateSlots(
    {
      frontmatter: astInput.frontmatter,
      partials: slide.resolvedPartials
    },
    {
      slideNumber,
      slideCount
    }
  );

  return (
    <section
      className={sectionClassName}
      data-power-slide-layout={slide.layout}
      data-power-slide-root
    >
      {template.render(decodeResult.props, slots)}
    </section>
  );
}
