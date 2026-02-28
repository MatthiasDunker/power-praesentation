// inspiered by https://github.com/unocss/unocss/blob/main/packages/preset-mini/src/_rules/spacing.ts

import { directionMap as featureMap, PropertyMap } from "../_utils/mappings";
import { createShortcutsFactory } from "../_utils/create-shortcuts";
import { createRulesFactory } from "../_utils/create-rules";
import { CreateRegExpConfigFunction } from "../_utils/regexp-config";

const createRegExpConfig: CreateRegExpConfigFunction = (name: string) => [
  {
    raw: `(p|m)()-(${name})`,
    autocomplete: `(-m|m|p)-${name}`,
  },
  {
    raw: `(p|m)-?([xy])-(${name})`,
  },
  {
    raw: `(p|m)-?([rltbse])-(${name})`,
    autocomplete: `(-m|m|p)<directions>-${name}`,
  },
  // {
  //   raw: `(p|-?m)-(block|inline)-(${name})`,
  //   autocomplete: `(m|p)-(block|inline)-${name}`,
  // },
  {
    raw: `(p|m)-?([bi][se])-(${name})`,
    autocomplete: `(-m|m|p)-(bs|be|is|ie)-${name}`,
  },
];

export const propertyMap: PropertyMap = {
  p: "padding",
  m: "margin",
};

export const createShortcuts = createShortcutsFactory(createRegExpConfig);

export const createRules = createRulesFactory({
  createRegExpConfig,
  propertyMap,
  featureMap,
});

const collection = {
  createShortcuts,
  createRules,
};

export default collection;
