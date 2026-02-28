// inspiered by https://github.com/unocss/unocss/blob/main/packages/preset-mini/src/_rules/gap.ts

import { createShortcutsFactory } from "../_utils/create-shortcuts";
import { FeatureMap, PropertyMap } from "../_utils/mappings";
import { createRulesFactory } from "../_utils/create-rules";
import { CreateRegExpConfigFunction } from "../_utils/regexp-config";

const createRegExpConfig: CreateRegExpConfigFunction = (name: string) => [
  {
    // raw: `(?:flex-|grid-)?(gap)-(?:(x|y|col|row)-)?(${name})`,
    raw: `(?:flex-|grid-)?(gap)-((?:(?:x|y|col|row)-)?)(${name})`,
    autocomplete: [`gap-${name}`, `gap-(x|y|col|row)-${name}`],
  },
];

export const propertyMap: PropertyMap = {
  gap: "gap",
};

export const featureMap: FeatureMap = {
  "": "",
  x: "column-",
  y: "row-",
  col: "column-",
  row: "row-",
};

export const createShortcuts = createShortcutsFactory(createRegExpConfig);

export const createRules = createRulesFactory({
  createRegExpConfig,
  featureMap,
});

const collection = {
  createShortcuts,
  createRules,
};

export default collection;
