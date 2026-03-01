import type { SlideContainerRule, SlideTemplateDefinition } from "../../types";
import type { MarkdownTemplateProps } from "../shared";
import { markdownTemplateDecoder } from "../shared";

export const imageLeftCopyContainerRules: readonly SlideContainerRule[] = [];

export const imageLeftCopyTemplateDefinition: SlideTemplateDefinition<MarkdownTemplateProps> = {
  id: "image-left-copy",
  containerRules: imageLeftCopyContainerRules,
  decoder: markdownTemplateDecoder
};
