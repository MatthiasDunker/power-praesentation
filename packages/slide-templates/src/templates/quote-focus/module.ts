import type { CoreTemplateId } from "@power/contracts";
import type { SlideTemplateModule } from "../../ui-types";
import { decodeQuoteFocus } from "./decode";
import { QuoteFocusTemplate } from "./render";
import { quoteFocusContainerRules } from "./spec";
import { baseTemplateRootClassName } from "../shared";

export const quoteFocusTemplateModule: SlideTemplateModule = {
  id: "quote-focus" satisfies CoreTemplateId,
  containerRules: quoteFocusContainerRules,
  decode: decodeQuoteFocus,
  rootClassName: `${baseTemplateRootClassName} [&_p]:text-[44px] [&_p]:italic`,
  render: (props, slots) => QuoteFocusTemplate(props as never, slots)
};
