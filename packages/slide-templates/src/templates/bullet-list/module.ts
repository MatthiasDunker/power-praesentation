import type { CoreTemplateId } from "@power/contracts";
import type { SlideTemplateModule } from "../../ui-types";
import { BulletListTemplate } from "./render";
import { bulletListTemplateDefinition } from "./spec";
import { baseTemplateRootClassName } from "../shared";

export const bulletListTemplateModule: SlideTemplateModule = {
  id: "bullet-list" satisfies CoreTemplateId,
  containerRules: bulletListTemplateDefinition.containerRules,
  decoder: bulletListTemplateDefinition.decoder,
  rootClassName: baseTemplateRootClassName,
  render: (props, slots) => BulletListTemplate(props as never, slots)
};
