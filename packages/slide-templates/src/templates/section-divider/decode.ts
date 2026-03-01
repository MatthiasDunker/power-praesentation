import { decodeSlideTemplate } from "../../decode-engine";
import type { SlideAstInput, SlideDecodeResult } from "../../types";
import { sectionDividerTemplateDefinition } from "./spec";
import type { MarkdownTemplateProps } from "../shared";

export function decodeSectionDivider(
  input: SlideAstInput
): SlideDecodeResult<MarkdownTemplateProps> {
  return decodeSlideTemplate(sectionDividerTemplateDefinition, input);
}
