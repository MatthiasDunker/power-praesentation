import type { SlideContainerRule, SlideTemplateDefinition } from "../../types";
import type { MarkdownTemplateProps } from "../shared";
import { markdownTemplateDecoder } from "../shared";

export const imageRightCopyContainerRules: readonly SlideContainerRule[] = [];

export const imageRightCopyTemplateDefinition: SlideTemplateDefinition<MarkdownTemplateProps> = {
  id: "image-right-copy",
  containerRules: imageRightCopyContainerRules,
  decoder: markdownTemplateDecoder
};
