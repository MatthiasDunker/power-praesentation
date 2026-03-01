import { decodeSlideTemplate } from "../../decode-engine";
import type { SlideAstInput, SlideDecodeResult } from "../../types";
import { imageRightCopyTemplateDefinition } from "./spec";
import type { MarkdownTemplateProps } from "../shared";

export function decodeImageRightCopy(
  input: SlideAstInput
): SlideDecodeResult<MarkdownTemplateProps> {
  return decodeSlideTemplate(imageRightCopyTemplateDefinition, input);
}
