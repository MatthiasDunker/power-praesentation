import type { SlideTemplateModule } from "./ui-types";
import { bulletListTemplateModule } from "./templates/bullet-list/module";
import { imageLeftCopyTemplateModule } from "./templates/image-left-copy/module";
import { imageRightCopyTemplateModule } from "./templates/image-right-copy/module";
import { metricHighlightTemplateModule } from "./templates/metric-highlight/module";
import { multiColumnTemplateModule } from "./templates/multi-column/module";
import { quoteFocusTemplateModule } from "./templates/quote-focus/module";
import { sectionDividerTemplateModule } from "./templates/section-divider/module";
import { titleHeroTemplateModule } from "./templates/title-hero/module";
import { twoColumnTemplateModule } from "./templates/two-column/module";

export const coreSlideTemplateModules: ReadonlyArray<SlideTemplateModule<unknown>> = [
  titleHeroTemplateModule,
  sectionDividerTemplateModule,
  bulletListTemplateModule,
  twoColumnTemplateModule,
  multiColumnTemplateModule,
  quoteFocusTemplateModule,
  imageLeftCopyTemplateModule,
  imageRightCopyTemplateModule,
  metricHighlightTemplateModule
];
