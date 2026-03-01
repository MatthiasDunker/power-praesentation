import type { SlideContainerRule, SlideTemplateDefinition } from "../../types";
import type { MarkdownTemplateProps } from "../shared";
import { markdownTemplateDecoder } from "../shared";

export const sectionDividerContainerRules: readonly SlideContainerRule[] = [];

export const sectionDividerTemplateDefinition: SlideTemplateDefinition<MarkdownTemplateProps> = {
  id: "section-divider",
  containerRules: sectionDividerContainerRules,
  decoder: markdownTemplateDecoder
};
