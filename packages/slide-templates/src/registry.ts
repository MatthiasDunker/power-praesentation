import type { SlideTemplateDefinition, SlideTemplateRegistry } from "./types";

interface CreateTemplateRegistryOptions {
  core: ReadonlyArray<SlideTemplateDefinition<unknown>>;
  extensions?: ReadonlyArray<SlideTemplateDefinition<unknown>>;
}

export function createTemplateRegistry({
  core,
  extensions = []
}: CreateTemplateRegistryOptions): SlideTemplateRegistry {
  const registry: SlideTemplateRegistry = {};

  for (const template of [...core, ...extensions]) {
    registry[template.id] = template;
  }

  return registry;
}
