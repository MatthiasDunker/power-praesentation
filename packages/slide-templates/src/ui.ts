import { coreSlideTemplateModules } from "./core-modules";
import { createTemplateModuleRegistry } from "./ui-registry";
import type { SlideTemplateModule, SlideTemplateModuleRegistry } from "./ui-types";

export { BasicMarkdown } from "./markdown/basic-markdown";
export * from "./core-modules";
export * from "./partials";
export * from "./ui-registry";
export * from "./ui-types";

export function createCoreTemplateModuleRegistry(
  extensions: ReadonlyArray<SlideTemplateModule<unknown>> = []
): SlideTemplateModuleRegistry {
  return createTemplateModuleRegistry({
    core: coreSlideTemplateModules,
    extensions
  });
}
