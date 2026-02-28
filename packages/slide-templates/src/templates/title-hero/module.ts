import type { CoreTemplateId } from "@power/contracts";
import type { SlideTemplateModule } from "../../ui-types";
import { decodeTitleHero } from "./decode";
import { TitleHeroTemplate } from "./render";
import { titleHeroContainerRules } from "./spec";
import { baseTemplateRootClassName } from "../shared";

export const titleHeroTemplateModule: SlideTemplateModule = {
  id: "title-hero" satisfies CoreTemplateId,
  containerRules: titleHeroContainerRules,
  decode: decodeTitleHero,
  rootClassName: `${baseTemplateRootClassName} flex flex-col justify-center`,
  render: (props) => TitleHeroTemplate(props as never)
};
