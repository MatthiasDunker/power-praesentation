import { decodeSlideTemplate } from "../../decode-engine";
import type { SlideAstInput, SlideDecodeResult } from "../../types";
import { twoColumnTemplateDefinition } from "./spec";
import type { TwoColumnTemplateProps } from "../shared";

export function decodeTwoColumn(
  input: SlideAstInput
): SlideDecodeResult<TwoColumnTemplateProps> {
  return decodeSlideTemplate(twoColumnTemplateDefinition, input);
}
