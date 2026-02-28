// inspiered by https://github.com/unocss/unocss/blob/main/packages/preset-mini/src/_rules/size.ts

import { createShortcutsFactory } from "../_utils/create-shortcuts";
import { PropertyMap } from "../_utils/mappings";
import { createRulesFactory } from "../_utils/create-rules";
import { CreateRegExpConfigFunction } from "../_utils/regexp-config";

const createRegExpConfig: CreateRegExpConfigFunction = (name: string) => [
  {
    raw: `((?:(?:min|max)-)?(?:size|w|h))()-(${name})`,
    autocomplete: [
      `size-${name}`,
      `(min|max)-size-${name}`,
      `(w|h)-${name}`,
      `(max|min)-(w|h|block|inline)`,
      `(max|min)-(w|h|block|inline)-${name}`,
    ],
  },
];

export const propertyMap: PropertyMap = {
  w: "width",
  "min-w": "min-width",
  "max-w": "max-width",
  h: "height",
  "min-h": "min-height",
  "max-h": "max-height",
  size: ["width", "height"],
  "min-size": ["min-width", "min-height"],
  "max-size": ["max-width", "max-height"],
};

export const createShortcuts = createShortcutsFactory(createRegExpConfig);

export const createRules = createRulesFactory({
  createRegExpConfig,
  propertyMap,
});

const collection = {
  createShortcuts,
  createRules,
};

export default collection;
