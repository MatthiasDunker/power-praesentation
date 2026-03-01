import { decodeSlideTemplate } from "../../decode-engine";
import type { SlideAstInput, SlideDecodeResult } from "../../types";
import { imageLeftCopyTemplateDefinition } from "./spec";
import type { MarkdownTemplateProps } from "../shared";

export function decodeImageLeftCopy(
  input: SlideAstInput
): SlideDecodeResult<MarkdownTemplateProps> {
  return decodeSlideTemplate(imageLeftCopyTemplateDefinition, input);
}
