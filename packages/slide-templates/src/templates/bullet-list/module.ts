import type { CoreTemplateId } from "@power/contracts";
import type { SlideTemplateModule } from "../../ui-types";
import { decodeBulletList } from "./decode";
import { BulletListTemplate } from "./render";
import { bulletListContainerRules } from "./spec";
import { baseTemplateRootClassName } from "../shared";

export const bulletListTemplateModule: SlideTemplateModule = {
  id: "bullet-list" satisfies CoreTemplateId,
  containerRules: bulletListContainerRules,
  decode: decodeBulletList,
  rootClassName: baseTemplateRootClassName,
  render: (props) => BulletListTemplate(props as never)
};
