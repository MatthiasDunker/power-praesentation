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
  rootClassName: `${baseTemplateRootClassName} grid place-content-center text-center`,
  render: (props) => SectionDividerTemplate(props as never)
};
