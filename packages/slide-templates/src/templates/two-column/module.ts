import type { CoreTemplateId } from "@power/contracts";
import type { SlideTemplateModule } from "../../ui-types";
import { TwoColumnTemplate } from "./render";
import { twoColumnTemplateDefinition } from "./spec";
import { baseTemplateRootClassName } from "../shared";

export const twoColumnTemplateModule: SlideTemplateModule = {
  id: "two-column" satisfies CoreTemplateId,
  containerRules: twoColumnTemplateDefinition.containerRules,
  decoder: twoColumnTemplateDefinition.decoder,
  rootClassName: baseTemplateRootClassName,
  render: (props, slots) => TwoColumnTemplate(props as never, slots)
};
