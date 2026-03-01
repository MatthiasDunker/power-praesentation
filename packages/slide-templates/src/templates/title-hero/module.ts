import type { CoreTemplateId } from "@power/contracts";
import type { SlideTemplateModule } from "../../ui-types";
import { TitleHeroTemplate } from "./render";
import { titleHeroTemplateDefinition } from "./spec";
import { baseTemplateRootClassName } from "../shared";

export const titleHeroTemplateModule: SlideTemplateModule = {
  id: "title-hero" satisfies CoreTemplateId,
  containerRules: titleHeroTemplateDefinition.containerRules,
  decoder: titleHeroTemplateDefinition.decoder,
  rootClassName: `${baseTemplateRootClassName} flex flex-col justify-center`,
  render: (props, slots) => TitleHeroTemplate(props as never, slots)
};
