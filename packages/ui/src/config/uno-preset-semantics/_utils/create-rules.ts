import type { Rule, RuleContext } from "unocss";
import { cssObjectToString, getLayerSuffix } from "../_utils/utilities";
import { CssVariableConfig, PresetSemanticUtilsOptions } from "..";
import { FeatureMap, PropertyMap } from "../_utils/mappings";
import { CreateRegExpConfigFunction } from "./regexp-config";

type StringOrArrayOfStrings = string | string[];

function stringOrArrayToArray<T extends string>(v: T | T[]): T[] {
  return Array.isArray(v) ? v : [v];
}

function forEachCombinationMap<
  T extends [StringOrArrayOfStrings, StringOrArrayOfStrings],
  R,
>(arr: T, cb: (v: [string, string]) => R): R[] {
  const first = stringOrArrayToArray(arr[0]);
  const second = stringOrArrayToArray(arr[1]);
  return first.flatMap((slugF) => second.map((slugS) => cb([slugF, slugS])));
}

type CreateRulesFactoryProps = {
  createRegExpConfig: CreateRegExpConfigFunction;
  propertyMap?: PropertyMap;
  featureMap?: FeatureMap;
};

export const createRulesFactory =
  ({
    createRegExpConfig,
    propertyMap = { "": "" },
    featureMap = { "": "" },
  }: CreateRulesFactoryProps) =>
  (
    cssVariable: CssVariableConfig,
    layers: PresetSemanticUtilsOptions["layers"],
  ): Rule[] => {
    const { name, type, value, breakpointValues } = cssVariable;

    const varName = `--${type}-${name}`;

    const handleRootVars = (
      []: string[],
      {
        theme,
      }: RuleContext<{
        breakpoints?: Record<string, string>;
      }>,
    ): string => {
      return cssObjectToString(`:root`, {
        [varName]: value,
        ...(!!breakpointValues &&
          !!breakpointValues.length &&
          breakpointValues.reduce((acc, [breakpoint, value]) => {
            return {
              ...acc,
              [`@media (min-width: ${(theme.breakpoints && theme.breakpoints[breakpoint]) ?? breakpoint})`]:
                {
                  [varName]: value,
                },
            };
          }, {})),
      });
    };

    const createClassHandler = (layerSuffix: string) =>
      function handleClass(
        [match, propertyShort, feature, varNameMatch]: string[],
        { rawSelector }: RuleContext<object>,
      ): string | undefined {
        var selector = rawSelector.split(layerSuffix)[0];
        if (varNameMatch != null) {
          const isNegative = rawSelector.startsWith("-");
          let value = isNegative
            ? `calc(var(${varName}) * -1)`
            : `var(${varName})`;
          return `.${selector} {
    ${forEachCombinationMap(
      [
        typeof propertyMap[propertyShort] !== "undefined"
          ? propertyMap[propertyShort]
          : propertyShort,
        featureMap[feature],
      ],
      ([partOne, partTwo]) => `${partOne}${partTwo}: ${value};`,
    ).join("\n")}
}`;
          //           return `.${selector} {
          //   ${typeof featureMap[direction] === "string" ?
          //     `${propertyMap[propertyShort]}${featureMap[direction]}: ${value};`:
          //     featureMap[direction].map(
          //       (featureSuffix) =>
          //         `${propertyMap[propertyShort]}${featureSuffix}: ${value};`,
          //     )
          //     .join("\n")}
          //   }`;
        }
      };

    const selectorLayerSuffix = getLayerSuffix(layers.selector);
    const rules: Rule[] = createRegExpConfig(name).flatMap(({ raw }) => [
      [
        new RegExp(`^${raw}${getLayerSuffix(layers.root)}$`),
        handleRootVars,
        { layer: layers.root },
      ],
      [
        new RegExp(`^${raw}${selectorLayerSuffix}$`),
        createClassHandler(selectorLayerSuffix),
        { layer: layers.selector },
      ],
    ]);

    return rules;
  };
