import { decodeSlideTemplate } from "../../decode-engine";
import type { SlideAstInput, SlideDecodeResult } from "../../types";
import { quoteFocusTemplateDefinition } from "./spec";
import type { MarkdownTemplateProps } from "../shared";

export function decodeQuoteFocus(
  input: SlideAstInput
): SlideDecodeResult<MarkdownTemplateProps> {
  return decodeSlideTemplate(quoteFocusTemplateDefinition, input);
}
