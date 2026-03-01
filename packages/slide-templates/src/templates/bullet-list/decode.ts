import { decodeSlideTemplate } from "../../decode-engine";
import type { SlideAstInput, SlideDecodeResult } from "../../types";
import {
  bulletListTemplateDefinition,
  type BulletListTemplateProps
} from "./spec";

export type { BulletListTemplateProps } from "./spec";

export function decodeBulletList(
  input: SlideAstInput
): SlideDecodeResult<BulletListTemplateProps> {
  return decodeSlideTemplate(bulletListTemplateDefinition, input);
}
