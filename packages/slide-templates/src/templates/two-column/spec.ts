import type { SlideContainerRule, SlideTemplateDefinition } from "../../types";
import type { TwoColumnTemplateProps } from "../shared";
import { twoColumnTemplateDecoder } from "../shared";

export const twoColumnContainerRules: readonly SlideContainerRule[] = [
  {
    kind: "column",
    min: 2,
    max: 2
  }
];

export const twoColumnTemplateDefinition: SlideTemplateDefinition<TwoColumnTemplateProps> = {
  id: "two-column",
  containerRules: twoColumnContainerRules,
  decoder: twoColumnTemplateDecoder
};
