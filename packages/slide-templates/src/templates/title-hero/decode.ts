import { decodeSlideTemplate } from "../../decode-engine";
import type { SlideAstInput, SlideDecodeResult } from "../../types";
import {
  titleHeroTemplateDefinition,
  type TitleHeroTemplateProps
} from "./spec";

export type { TitleHeroTemplateProps } from "./spec";

export function decodeTitleHero(
  input: SlideAstInput
): SlideDecodeResult<TitleHeroTemplateProps> {
  return decodeSlideTemplate(titleHeroTemplateDefinition, input);
}
