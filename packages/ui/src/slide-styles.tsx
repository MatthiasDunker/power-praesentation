import { createGenerator } from "@unocss/core";
import presetWind from "@unocss/preset-wind";
import { coreSlideTemplateRegistryVersion } from "@power/slide-templates";
import { useEffect, useState } from "react";
import config from "./config/uno.config";

const cssCacheByTemplateKey = new Map<string, string>();
let generatorPromise: Promise<
  Awaited<ReturnType<typeof createGenerator>>
> | null = null;

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
  cacheKey?: string,
): Promise<string> {
  if (cacheKey && cssCacheByTemplateKey.has(cacheKey)) {
    return cssCacheByTemplateKey.get(cacheKey) ?? "";
  }

  if (html.trim().length === 0) {
    return "";
  }

  const generator = await getUnoGenerator();
  const { css } = await generator.generate(html, {
    minify: true,
  });

  const result = css || "";

  if (cacheKey) {
    cssCacheByTemplateKey.set(cacheKey, result);
  }

  return result;
}

interface GenerateSlideCssForExportOptions {
  autoprefix?: boolean;
}

export async function generateSlideCssForExport(
  html: string,
  options: GenerateSlideCssForExportOptions = {},
): Promise<string> {
  const css = await generateSlideCssFromHtml(html);

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
  selector = "[data-power-slide-root]",
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
      const css = await generateSlideCssFromHtml(html, cacheKey);

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
