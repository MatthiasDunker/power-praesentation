import { decodeSlideTemplate } from "../../decode-engine";
import type { SlideAstInput, SlideDecodeResult } from "../../types";
import { metricHighlightTemplateDefinition } from "./spec";
import type { MarkdownTemplateProps } from "../shared";

export function decodeMetricHighlight(
  input: SlideAstInput
): SlideDecodeResult<MarkdownTemplateProps> {
  return decodeSlideTemplate(metricHighlightTemplateDefinition, input);
}
