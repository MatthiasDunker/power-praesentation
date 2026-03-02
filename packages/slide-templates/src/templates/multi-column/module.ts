import type { CoreTemplateId } from "@power/contracts";
import type { SlideTemplateModule } from "../../ui-types";
import { MultiColumnTemplate } from "./render";
import { multiColumnTemplateDefinition } from "./spec";
import { baseTemplateRootClassName } from "../shared";

export const multiColumnTemplateModule: SlideTemplateModule = {
  id: "multi-column" satisfies CoreTemplateId,
  containerRules: multiColumnTemplateDefinition.containerRules,
  decoder: multiColumnTemplateDefinition.decoder,
  rootClassName: baseTemplateRootClassName,
  render: (props, slots) => MultiColumnTemplate(props as never, slots)
};
