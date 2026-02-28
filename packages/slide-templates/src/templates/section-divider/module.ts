import type { CoreTemplateId } from "@power/contracts";
import type { SlideTemplateModule } from "../../ui-types";
import { decodeSectionDivider } from "./decode";
import { SectionDividerTemplate } from "./render";
import { sectionDividerContainerRules } from "./spec";
import { baseTemplateRootClassName } from "../shared";

export const sectionDividerTemplateModule: SlideTemplateModule = {
  id: "section-divider" satisfies CoreTemplateId,
  containerRules: sectionDividerContainerRules,
  decode: decodeSectionDivider,
  rootClassName: `${baseTemplateRootClassName} text-center`,
  render: (props, slots) => SectionDividerTemplate(props as never, slots)
};
