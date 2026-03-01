import type { CoreTemplateId } from "@power/contracts";
import type { SlideTemplateModule } from "../../ui-types";
import { ImageRightCopyTemplate } from "./render";
import { imageRightCopyTemplateDefinition } from "./spec";
import { baseTemplateRootClassName } from "../shared";

export const imageRightCopyTemplateModule: SlideTemplateModule = {
  id: "image-right-copy" satisfies CoreTemplateId,
  containerRules: imageRightCopyTemplateDefinition.containerRules,
  decoder: imageRightCopyTemplateDefinition.decoder,
  rootClassName: `${baseTemplateRootClassName} grid grid-cols-[56%_44%] grid-rows-[minmax(0,1fr)_auto] gap-6`,
  render: (props, slots) => ImageRightCopyTemplate(props as never, slots)
};
