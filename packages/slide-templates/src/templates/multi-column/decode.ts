import { decodeSlideTemplate } from "../../decode-engine";
import type { SlideAstInput, SlideDecodeResult } from "../../types";
import { multiColumnTemplateDefinition } from "./spec";
import type { MultiColumnTemplateProps } from "../shared";

export function decodeMultiColumn(
  input: SlideAstInput
): SlideDecodeResult<MultiColumnTemplateProps> {
  return decodeSlideTemplate(multiColumnTemplateDefinition, input);
}
