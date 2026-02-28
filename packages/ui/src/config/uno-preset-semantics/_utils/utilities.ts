import type { CSSObject, CSSValue } from "unocss";
import styleToCss from "style-object-to-css-string";

export function getLayerSuffix(layer: string) {
  return `___LAYER_${layer}`;
}

export function isMediaquery(value: unknown): value is {
  [key: string]: CSSValue;
} {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function cssObjectToString(selector: string, cssObject: CSSObject) {
  // TODO: turn into prototype method
  const entries = Object.entries(cssObject);
  const mediaqueryKeys: string[] = [];
  const mediaqueries =
    entries
      .filter(([property, value]) => {
        const isMQ = isMediaquery(value);
        if (isMQ) {
          mediaqueryKeys.push(property);
        }
        return isMQ;
      })
      .map(([key]) => [key, cssObject[key]]) || [];

  const cssWithoutMediaqueries = entries.reduce(
    (acc, [property, value]) => {
      if (
        !mediaqueryKeys.includes(property) &&
        (typeof value === "string" || typeof value === "number")
      ) {
        acc[property] = value;
      }
      return acc;
    },
    {} as {
      [key: string]: string | number;
    },
  );

  return `${selector} {
${styleToCss(cssWithoutMediaqueries)}
}${mediaqueries
    .map(
      ([key, value]) => `\n${key} {
  ${selector} {
    ${styleToCss(value)}
  }
}`,
    )
    .join("\n")}`;
}
