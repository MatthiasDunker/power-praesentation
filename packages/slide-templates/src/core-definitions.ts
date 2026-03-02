import type { SlideTemplateDefinition } from "./types";
import { bulletListTemplateDefinition } from "./templates/bullet-list/spec";
import { imageLeftCopyTemplateDefinition } from "./templates/image-left-copy/spec";
import { imageRightCopyTemplateDefinition } from "./templates/image-right-copy/spec";
import { metricHighlightTemplateDefinition } from "./templates/metric-highlight/spec";
import { multiColumnTemplateDefinition } from "./templates/multi-column/spec";
import { quoteFocusTemplateDefinition } from "./templates/quote-focus/spec";
import { sectionDividerTemplateDefinition } from "./templates/section-divider/spec";
import { titleHeroTemplateDefinition } from "./templates/title-hero/spec";
import { twoColumnTemplateDefinition } from "./templates/two-column/spec";

export const coreSlideTemplateDefinitions: ReadonlyArray<
  SlideTemplateDefinition<unknown>
> = [
  titleHeroTemplateDefinition,
  sectionDividerTemplateDefinition,
  bulletListTemplateDefinition,
  twoColumnTemplateDefinition,
  multiColumnTemplateDefinition,
  quoteFocusTemplateDefinition,
  imageLeftCopyTemplateDefinition,
  imageRightCopyTemplateDefinition,
  metricHighlightTemplateDefinition
];

export const coreSlideTemplateRegistryVersion = "core-v1";
