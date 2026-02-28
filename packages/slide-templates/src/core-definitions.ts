import type { SlideTemplateDefinition } from "./types";
import { decodeBulletList } from "./templates/bullet-list/decode";
import { bulletListContainerRules } from "./templates/bullet-list/spec";
import { decodeImageLeftCopy } from "./templates/image-left-copy/decode";
import { imageLeftCopyContainerRules } from "./templates/image-left-copy/spec";
import { decodeImageRightCopy } from "./templates/image-right-copy/decode";
import { imageRightCopyContainerRules } from "./templates/image-right-copy/spec";
import { decodeMetricHighlight } from "./templates/metric-highlight/decode";
import { metricHighlightContainerRules } from "./templates/metric-highlight/spec";
import { decodeQuoteFocus } from "./templates/quote-focus/decode";
import { quoteFocusContainerRules } from "./templates/quote-focus/spec";
import { decodeSectionDivider } from "./templates/section-divider/decode";
import { sectionDividerContainerRules } from "./templates/section-divider/spec";
import { decodeTitleHero } from "./templates/title-hero/decode";
import { titleHeroContainerRules } from "./templates/title-hero/spec";
import { decodeTwoColumn } from "./templates/two-column/decode";
import { twoColumnContainerRules } from "./templates/two-column/spec";

export const coreSlideTemplateDefinitions: ReadonlyArray<
  SlideTemplateDefinition<unknown>
> = [
  {
    id: "title-hero",
    containerRules: titleHeroContainerRules,
    decode: decodeTitleHero
  },
  {
    id: "section-divider",
    containerRules: sectionDividerContainerRules,
    decode: decodeSectionDivider
  },
  {
    id: "bullet-list",
    containerRules: bulletListContainerRules,
    decode: decodeBulletList
  },
  {
    id: "two-column",
    containerRules: twoColumnContainerRules,
    decode: decodeTwoColumn
  },
  {
    id: "quote-focus",
    containerRules: quoteFocusContainerRules,
    decode: decodeQuoteFocus
  },
  {
    id: "image-left-copy",
    containerRules: imageLeftCopyContainerRules,
    decode: decodeImageLeftCopy
  },
  {
    id: "image-right-copy",
    containerRules: imageRightCopyContainerRules,
    decode: decodeImageRightCopy
  },
  {
    id: "metric-highlight",
    containerRules: metricHighlightContainerRules,
    decode: decodeMetricHighlight
  }
];

export const coreSlideTemplateRegistryVersion = "core-v1";
