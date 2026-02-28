import { createGenerator } from "@unocss/core";
import presetWind from "@unocss/preset-wind";
import { coreSlideTemplateRegistryVersion } from "@power/slide-templates";
import { useEffect, useState } from "react";
import config from "./config/uno.config";

const cssCacheByTemplateKey = new Map<string, string>();
let generatorPromise: Promise<
  Awaited<ReturnType<typeof createGenerator>>
> | null = null;
const defaultSlideScopeSelector = "[data-power-slide-root]";

interface GenerateSlideCssFromHtmlOptions {
  cacheKey?: string;
  scopeSelector?: string | null;
}

function resolveGenerateSlideCssOptions(
  cacheKeyOrOptions?: string | GenerateSlideCssFromHtmlOptions,
): Required<GenerateSlideCssFromHtmlOptions> {
  if (typeof cacheKeyOrOptions === "string") {
    return {
      cacheKey: cacheKeyOrOptions,
      scopeSelector: defaultSlideScopeSelector,
    };
  }

  return {
    cacheKey: cacheKeyOrOptions?.cacheKey ?? "",
    scopeSelector:
      cacheKeyOrOptions?.scopeSelector ?? defaultSlideScopeSelector,
  };
}

function getCacheLookupKey(
  cacheKey: string,
  scopeSelector: string | null,
): string {
  const normalizedScopeSelector = scopeSelector?.trim() || "none";
  return `${cacheKey}::${normalizedScopeSelector}`;
}

function scopeCssText(cssText: string, scopeSelector: string | null): string {
  if (!scopeSelector || scopeSelector.trim().length === 0) {
    return cssText;
  }

  if (cssText.trim().length === 0) {
    return cssText;
  }

  // Keep root-level variables local to each slide root when scoping.
  const normalizedCssText = cssText.replace(/:root\b/g, ":scope");
  return `@scope (${scopeSelector}){${normalizedCssText}}`;
}

async function getUnoGenerator() {
  if (!generatorPromise) {
    generatorPromise = Promise.resolve(
      createGenerator(
        config,
        //       {
        //       presets: [presetWind()],
        //       preflights: [
        //         {
        //           getCSS: () => {
        //             return `
        //               .page {
        //                 width: 100%;
        //                 height: 100%;
        //               }

        //                   .the-grid {
        //     position: absolute;
        //     top: 0;
        //     left: 0;
        //     margin: 48px;
        //     width: calc(100% - 96px);
        //     height: calc(100% - 96px);
        // }
        //             `;
        //           },
        //         },
        //       ],
        //     }
      ),
    ) as Promise<Awaited<ReturnType<typeof createGenerator>>>;
  }

  return generatorPromise;
}

async function collectRenderedSlidesHtml(selector: string): Promise<string> {
  await new Promise<void>((resolve) => {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => resolve());
    });
  });

  const nodes = Array.from(document.querySelectorAll<HTMLElement>(selector));
  return nodes.map((node) => node.outerHTML).join("\n");
}

export async function generateSlideCssFromHtml(
  html: string,
  cacheKeyOrOptions?: string | GenerateSlideCssFromHtmlOptions,
): Promise<string> {
  const { cacheKey, scopeSelector } =
    resolveGenerateSlideCssOptions(cacheKeyOrOptions);
  const scopedCacheKey = cacheKey
    ? getCacheLookupKey(cacheKey, scopeSelector)
    : null;

  if (scopedCacheKey && cssCacheByTemplateKey.has(scopedCacheKey)) {
    return cssCacheByTemplateKey.get(scopedCacheKey) ?? "";
  }

  if (html.trim().length === 0) {
    return "";
  }

  const generator = await getUnoGenerator();
  const { css } = await generator.generate(html, {
    minify: true,
  });

  const result = scopeCssText(css || "", scopeSelector);

  if (scopedCacheKey) {
    cssCacheByTemplateKey.set(scopedCacheKey, result);
  }

  return result;
}

interface GenerateSlideCssForExportOptions {
  autoprefix?: boolean;
  scopeSelector?: string | null;
}

export async function generateSlideCssForExport(
  html: string,
  options: GenerateSlideCssForExportOptions = {},
): Promise<string> {
  const css = await generateSlideCssFromHtml(html, {
    scopeSelector: options.scopeSelector,
  });

  if (options.autoprefix !== true) {
    return css;
  }

  const postcss = (await import("postcss")).default;
  const autoprefixer = (await import("autoprefixer")).default;
  const processor = postcss([
    autoprefixer({
      overrideBrowserslist: ["last 2 versions", "> 0.1%"],
    }),
  ]);

  const result = await processor.process(css, {
    from: undefined,
  });

  return result.css || "";
}

interface SlideRuntimeStyleSheetProps {
  templateSignature: string;
  registryVersion?: string;
  selector?: string;
}

export function SlideRuntimeStyleSheet({
  templateSignature,
  registryVersion = coreSlideTemplateRegistryVersion,
  selector = defaultSlideScopeSelector,
}: SlideRuntimeStyleSheetProps) {
  const [cssText, setCssText] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    let cancelled = false;

    const run = async () => {
      const html = await collectRenderedSlidesHtml(selector);
      const cacheKey = `${registryVersion}:${templateSignature || "none"}`;
      const css = await generateSlideCssFromHtml(html, {
        cacheKey,
        scopeSelector: selector,
      });

      if (!cancelled) {
        setCssText(css);
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [registryVersion, selector, templateSignature]);

  return <style data-power-slide>{cssText}</style>;
}
