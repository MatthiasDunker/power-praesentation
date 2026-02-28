import type { SlideTemplateSlots } from "../ui-types";
import { FooterPartial } from "./footer";
import {
  type FooterRuntimeContext,
  resolveFooterPayload
} from "./footer-value";

export interface ResolveTemplateSlotsInput {
  frontmatter?: Record<string, string>;
  partials?: Record<string, unknown>;
}

export function resolveTemplateSlots(
  { frontmatter = {}, partials = {} }: ResolveTemplateSlotsInput,
  context: FooterRuntimeContext = {}
): SlideTemplateSlots {
  const footerSource = Object.prototype.hasOwnProperty.call(partials, "footer")
    ? partials.footer
    : frontmatter.footer;
  const footer = resolveFooterPayload(footerSource, context);

  if (typeof footer === "undefined") {
    return {};
  }

  return {
    footer: <FooterPartial value={footer} />
  };
}
