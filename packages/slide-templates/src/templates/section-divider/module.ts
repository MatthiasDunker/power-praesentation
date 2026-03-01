import type { CoreTemplateId } from "@power/contracts";
import type { SlideTemplateModule } from "../../ui-types";
import { SectionDividerTemplate } from "./render";
import { sectionDividerTemplateDefinition } from "./spec";
import { baseTemplateRootClassName } from "../shared";

export const sectionDividerTemplateModule: SlideTemplateModule = {
  id: "section-divider" satisfies CoreTemplateId,
  containerRules: sectionDividerTemplateDefinition.containerRules,
  decoder: sectionDividerTemplateDefinition.decoder,
  rootClassName: `${baseTemplateRootClassName} text-center`,
  render: (props, slots) => SectionDividerTemplate(props as never, slots)
};
