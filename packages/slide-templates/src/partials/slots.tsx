import type { SlideTemplateSlots } from "../ui-types";
import { FooterPartial } from "./footer";
import { resolveFooterValue } from "./footer-value";

export function resolveTemplateSlots(
  frontmatter: Record<string, string>
): SlideTemplateSlots {
  const footer = resolveFooterValue(frontmatter.footer);

  if (!footer) {
    return {};
  }

  return {
    footer: <FooterPartial text={footer} />
  };
}
