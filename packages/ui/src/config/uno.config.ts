import {
  defineConfig,
  // presetAttributify,
  // presetIcons,
  presetWind3,
  // presetWebFonts,
} from "unocss";
import presetReset from "./uno.preset-reset";
import presetSemantics from "./uno-preset-semantics";
import presetMatricss from "@matricss/unocss-preset";
import { createConfig } from "./uno.matricss";

const //RESET = "reset",
  BASE = "base",
  // SNIPPETS = "snippets", // list with dividers
  UI_PRIMITIVES = "ui-primitives"; // applied component classes
// LAYER_STYLES = "layer-styles",
// TEXT_STYLES = "text-styles",
// MODIFIED_LAYER_STYLES = "modified-layer-styles",
// SIZING = "sizing",
// UTILS = "utilities", // layout and spacing
// THEMES = "themes",
// MOTION = "motion";

export default defineConfig({
  layers: {
    [BASE]: -3,
    preflights: -2,
    [UI_PRIMITIVES]: -1,
    default: 0,
  },
  extendTheme: (theme) => ({
    ...theme,
    // colors: {
    //   ...theme.colors,
    //   ...colors,
    // },
  }),
  content: {
    filesystem: ["./src/**/*.{js,jsx,ts,tsx}"],
  },
  preflights: [
    {
      getCSS: () =>
        `

@font-face {
  font-family: "Radnika Next";
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src:
    url("/fonts/radnika_next-regular.woff2") format("woff2");
}
        :root {
          --font-main: "Radnika Next", system-ui, sans-serif;
          --font-display: var(--font-main), system-ui, sans-serif;
        }
           
        .prose > [class^="typo-"]:has(+ [class^="typo-"]),
        .prose > [class^="typo-"]:has(+ [class*=" typo-"]),
        .prose > [class*=" typo-"]:has(+ [class^="typo-"]),
        .prose > [class*=" typo-"]:has(+ [class*=" typo-"]) {
          margin-bottom: 0.75em;
        }
        .block-list-divider {
          border: 0.5px solid;
          border-width: 0.5px 0;
        }
        .block-list-divider:has(+ .block-list-divider) {
          border-width: 0.5px 0 0 0;
        }

        .typo-display {
          position: relative;
          top:0;
          left: -0.06em;
        }
    .page {
      position: relative;
      width: 100%;
      height: 100%;
    }

    .the-grid {
      position: absolute;
      top: 0;
      left: 0;
      margin: 48px;
      width: calc(100% - 96px);
      height: calc(100% - 96px);
  }
        
        `,
      layer: BASE,
    },
  ],
  presets: [
    presetReset({
      layer: BASE,
    }),
    presetWind3({}),
    presetMatricss({
      warnings: true,
      config: createConfig(),
      layers: {
        settings: BASE,
        elements: UI_PRIMITIVES,
        objects: UI_PRIMITIVES,
      },
    }),
    presetSemantics({
      vars: [
        {
          name: "content-max-width",
          type: "spacing",
          value: "1280px",
        },
        {
          name: "page",
          type: "spacing",
          value: "16px",
          breakpointValues: [
            ["md", "24px"],
            ["lg", "32px"],
            ["xl", "48px"],
          ],
        },
        {
          name: "section",
          type: "spacing",
          value: "48px",
          breakpointValues: [
            ["md", "56px"],
            ["lg", "72px"],
            ["xl", "96px"],
          ],
        },
        {
          name: "content",
          type: "spacing",
          value: "32px",
          breakpointValues: [
            ["md", "48px"],
            ["lg", "56px"],
            ["xl", "72px"],
          ],
        },
        {
          name: "gutter",
          type: "spacing",
          value: "32px",
          // breakpointValues: [["lg", "24px"]],
        },
        {
          name: "ui-x",
          type: "spacing",
          value: "16px",
          breakpointValues: [
            ["md", "24px"],
            ["lg", "32px"],
            ["xl", "40px"],
          ],
        },
        {
          name: "ui-y",
          type: "spacing",
          value: "8px",
          breakpointValues: [
            ["md", "12px"],
            ["lg", "16px"],
            ["xl", "20px"],
          ],
        },
        {
          name: "ui-x-small",
          type: "spacing",
          value: "8px",
          breakpointValues: [
            ["md", "12px"],
            ["lg", "16px"],
            ["xl", "20px"],
          ],
        },
        {
          name: "ui-y-small",
          type: "spacing",
          value: "4px",
          breakpointValues: [
            ["md", "6px"],
            ["lg", "8px"],
            ["xl", "10px"],
          ],
        },
      ],
      layers: {
        root: BASE,
        selector: UI_PRIMITIVES,
      },
    }),
  ],
});
