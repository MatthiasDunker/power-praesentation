// inspiered by https://github.com/unocss/unocss/blob/main/packages/preset-mini/src/_rules/spacing.ts

import { getLayerSuffix } from "../_utils/utilities";
import { CssVariableConfig, PresetSemanticUtilsOptions } from "..";
import type { Shortcut } from "@unocss/core";
import { CreateRegExpConfigFunction } from "./regexp-config";

export const createShortcutsFactory =
  (createRegExpConfig: CreateRegExpConfigFunction) =>
  (
    cssVariable: CssVariableConfig,
    layers: PresetSemanticUtilsOptions["layers"],
  ): Shortcut<object>[] => {
    const handler = ([fullMatch]: string[]): string[] => {
      const ruleMatchers = Object.values(layers).map(
        (layer) => `${fullMatch}${getLayerSuffix(layer)}`,
      );

      return ruleMatchers;
    };
    return createRegExpConfig(cssVariable.name).map(({ raw, autocomplete }) => {
      return [
        new RegExp(`^${raw}$`),
        handler,
        autocomplete ? { autocomplete } : {},
      ];
    });
  };
