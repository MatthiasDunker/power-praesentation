import type { CoreTemplateId } from "@power/contracts";
import type { SlideTemplateModule } from "../../ui-types";
import { decodeImageLeftCopy } from "./decode";
import { ImageLeftCopyTemplate } from "./render";
import { imageLeftCopyContainerRules } from "./spec";
import { baseTemplateRootClassName } from "../shared";

export const imageLeftCopyTemplateModule: SlideTemplateModule = {
  id: "image-left-copy" satisfies CoreTemplateId,
  containerRules: imageLeftCopyContainerRules,
  decode: decodeImageLeftCopy,
  rootClassName: `${baseTemplateRootClassName} grid grid-cols-[44%_56%] grid-rows-[minmax(0,1fr)_auto] gap-6`,
  render: (props, slots) => ImageLeftCopyTemplate(props as never, slots)
};
