import type { SlideContainerRule, SlideTemplateDefinition } from "../../types";
import type { MarkdownTemplateProps } from "../shared";
import { markdownTemplateDecoder } from "../shared";

export const quoteFocusContainerRules: readonly SlideContainerRule[] = [];

export const quoteFocusTemplateDefinition: SlideTemplateDefinition<MarkdownTemplateProps> = {
  id: "quote-focus",
  containerRules: quoteFocusContainerRules,
  decoder: markdownTemplateDecoder
};
