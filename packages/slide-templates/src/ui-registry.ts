import type { SlideTemplateModule, SlideTemplateModuleRegistry } from "./ui-types";

interface CreateTemplateModuleRegistryOptions {
  core: ReadonlyArray<SlideTemplateModule<unknown>>;
  extensions?: ReadonlyArray<SlideTemplateModule<unknown>>;
}

export function createTemplateModuleRegistry({
  core,
  extensions = []
}: CreateTemplateModuleRegistryOptions): SlideTemplateModuleRegistry {
  const registry: SlideTemplateModuleRegistry = {};

  for (const template of [...core, ...extensions]) {
    registry[template.id] = template;
  }

  return registry;
}
