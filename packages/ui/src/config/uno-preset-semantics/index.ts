import type { Rule, Preflight, Preset, Shortcut, PresetOptions } from "unocss";
import gapRules from "./_rules/gap";
import sizeRules from "./_rules/size";
import spacingRules from "./_rules/spacing";
import { createRulesFactory } from "./_utils/create-rules";
import { createShortcutsFactory } from "./_utils/create-shortcuts";

export type CssVariableConfig = {
  // css class compatible name
  name: string;
  // is it spacing or some other value
  type: string;
  // example value: "100px"#
  value: string;
  // example value: [ ["sm", "1rem"], ["md", "2rem"], ["lg", "3rem"] ]
  breakpointValues?: Array<[string | number, string]>;
};

// const typeMap = {
//   spacing: ["padding", "margin", "width", "height"],
// };

// https://tailwindcss.com/docs/theme#spacing
// By default, these values are inherited by the padding, margin, width, height, maxHeight, flex-basis, gap, inset, space, translate, scrollMargin, scrollPadding, and textIndent core plugins.

const mapTypeToHandlers: Record<
  string,
  Array<{
    createRules: ReturnType<typeof createRulesFactory>;
    createShortcuts: ReturnType<typeof createShortcutsFactory>;
  }>
> = {
  spacing: [gapRules, spacingRules, sizeRules],
};

export interface PresetSemanticUtilsOptions extends PresetOptions {
  /**
   * Variable definitions.
   *
   */
  vars: CssVariableConfig[];

  /**
   * Layers to render the vars on the root level and the actual classes or selectors at the selector level.
   */
  layers: {
    root: string;
    selector: string;
  };
}

export default function presetSemantics(
  options: PresetSemanticUtilsOptions,
): Preset {
  let shortcuts: Shortcut<object>[] = [];
  let rules: Rule<object>[] = [];
  let preflights: Preflight[] = [];

  options.vars.forEach(({ name, type, value, breakpointValues }) => {
    /**
     * 1. Create shortcut for all handlers of the same type
     *
     * 2. Create rules for all handlers of the same type
     */
    if (!!mapTypeToHandlers[type]) {
      shortcuts = shortcuts.concat(
        mapTypeToHandlers[type].flatMap(({ createShortcuts }) =>
          createShortcuts(
            { name, type, value, breakpointValues },
            options.layers,
          ),
        ),
      );
      rules = rules.concat(
        mapTypeToHandlers[type].flatMap(({ createRules }) =>
          createRules({ name, type, value, breakpointValues }, options.layers),
        ),
      );
    }
  });

  return {
    name: "preset-semantics",
    rules,
    preflights,
    shortcuts,
  };
}
