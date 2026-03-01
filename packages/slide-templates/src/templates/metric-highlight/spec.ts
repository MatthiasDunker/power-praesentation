import type { SlideContainerRule, SlideTemplateDefinition } from "../../types";
import type { MarkdownTemplateProps } from "../shared";
import { markdownTemplateDecoder } from "../shared";

export const metricHighlightContainerRules: readonly SlideContainerRule[] = [];

export const metricHighlightTemplateDefinition: SlideTemplateDefinition<MarkdownTemplateProps> = {
  id: "metric-highlight",
  containerRules: metricHighlightContainerRules,
  decoder: markdownTemplateDecoder
};
