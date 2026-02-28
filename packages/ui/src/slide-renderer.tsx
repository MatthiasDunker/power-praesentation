import type { SlideDocument, SlideLayoutId } from "@power/contracts";
import { createSlideAstInputFromDocument } from "@power/slide-templates";
import {
  createCoreTemplateModuleRegistry,
  type SlideTemplateModule,
  type SlideTemplateModuleRegistry
} from "@power/slide-templates/ui";

export interface SlideRendererProps {
  slide: SlideDocument;
  registry?: SlideTemplateModuleRegistry;
}

const fallbackLayout: SlideLayoutId = "bullet-list";
const unknownLayoutWarnings = new Set<string>();

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

export function SlideRenderer({ slide, registry = defaultRegistry }: SlideRendererProps) {
  const template = resolveTemplate(slide.layout, registry);

  if (!template) {
    return null;
  }

  const astInput = createSlideAstInputFromDocument(slide);
  const decodeResult = template.decode(astInput);
  const themeClassName = normalizeThemeClassName(astInput.frontmatter.theme);
  const sectionClassName = [template.rootClassName, themeClassName]
    .filter((value) => typeof value === "string" && value.length > 0)
    .join(" ");

  return (
    <section
      className={sectionClassName}
      data-power-slide-layout={slide.layout}
      data-power-slide-root
    >
      {template.render(decodeResult.props)}
    </section>
  );
}
