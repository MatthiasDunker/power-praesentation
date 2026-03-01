import type { CoreTemplateId } from "@power/contracts";
import type { SlideTemplateModule } from "../../ui-types";
import { QuoteFocusTemplate } from "./render";
import { quoteFocusTemplateDefinition } from "./spec";
import { baseTemplateRootClassName } from "../shared";

export const quoteFocusTemplateModule: SlideTemplateModule = {
  id: "quote-focus" satisfies CoreTemplateId,
  containerRules: quoteFocusTemplateDefinition.containerRules,
  decoder: quoteFocusTemplateDefinition.decoder,
  rootClassName: `${baseTemplateRootClassName} [&_p]:text-[44px] [&_p]:italic`,
  render: (props, slots) => QuoteFocusTemplate(props as never, slots)
};
