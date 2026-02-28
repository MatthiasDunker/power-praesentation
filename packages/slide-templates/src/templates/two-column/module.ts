import type { CoreTemplateId } from "@power/contracts";
import type { SlideTemplateModule } from "../../ui-types";
import { decodeTwoColumn } from "./decode";
import { TwoColumnTemplate } from "./render";
import { twoColumnContainerRules } from "./spec";
import { baseTemplateRootClassName } from "../shared";

export const twoColumnTemplateModule: SlideTemplateModule = {
  id: "two-column" satisfies CoreTemplateId,
  containerRules: twoColumnContainerRules,
  decode: decodeTwoColumn,
  rootClassName: baseTemplateRootClassName,
  render: (props) => TwoColumnTemplate(props as never)
};
