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
  rootClassName: `${baseTemplateRootClassName} grid grid-cols-[44%_56%] gap-6`,
  render: (props) => ImageLeftCopyTemplate(props as never)
};
