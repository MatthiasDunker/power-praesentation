import { coreSlideTemplateDefinitions } from "./core-definitions";
import { createTemplateRegistry } from "./registry";
import type { SlideTemplateDefinition, SlideTemplateRegistry } from "./types";

export * from "./core-definitions";
export * from "./fenced-containers";
export * from "./frontmatter";
export * from "./markdown-ast";
export * from "./partials/footer-value";
export * from "./registry";
export * from "./slide-ast-input";
export * from "./types";

export function createCoreTemplateRegistry(
  extensions: ReadonlyArray<SlideTemplateDefinition<unknown>> = []
): SlideTemplateRegistry {
  return createTemplateRegistry({
    core: coreSlideTemplateDefinitions,
    extensions
  });
}
