import type { CoreTemplateId } from "@power/contracts";
import type { SlideTemplateModule } from "../../ui-types";
import { ImageLeftCopyTemplate } from "./render";
import { imageLeftCopyTemplateDefinition } from "./spec";
import { baseTemplateRootClassName } from "../shared";

export const imageLeftCopyTemplateModule: SlideTemplateModule = {
  id: "image-left-copy" satisfies CoreTemplateId,
  containerRules: imageLeftCopyTemplateDefinition.containerRules,
  decoder: imageLeftCopyTemplateDefinition.decoder,
  rootClassName: `${baseTemplateRootClassName} grid grid-cols-[44%_56%] grid-rows-[minmax(0,1fr)_auto] gap-6`,
  render: (props, slots) => ImageLeftCopyTemplate(props as never, slots)
};
