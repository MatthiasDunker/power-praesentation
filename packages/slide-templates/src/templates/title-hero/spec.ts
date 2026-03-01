import { asNonEmptyString, toThemeClassName } from "../../decode-engine";
import type { SlideContainerRule, SlideTemplateDefinition } from "../../types";

export const titleHeroContainerRules: readonly SlideContainerRule[] = [];

export interface TitleHeroTemplateProps {
  overline?: string;
  title: string;
  text?: string;
  className?: string;
}

export const titleHeroTemplateDefinition: SlideTemplateDefinition<TitleHeroTemplateProps> = {
  id: "title-hero",
  containerRules: titleHeroContainerRules,
  decoder: {
    kind: "schema",
    schema: {
      fields: {
        overline: {
          sources: [
            { kind: "frontmatter", key: "overline", nonEmpty: true },
            { kind: "heading", depth: 2, nonEmpty: true }
          ],
          transform: (value) => asNonEmptyString(value)
        },
        title: {
          sources: [
            { kind: "heading", depth: 1, nonEmpty: true },
            { kind: "frontmatter", key: "title", nonEmpty: true }
          ],
          transform: (value) => asNonEmptyString(value),
          default: "Untitled",
          required: true
        },
        text: {
          sources: [
            { kind: "frontmatter", key: "text", nonEmpty: true },
            { kind: "paragraph", index: 0, nonEmpty: true }
          ],
          transform: (value) => asNonEmptyString(value)
        },
        className: {
          sources: [{ kind: "frontmatter", key: "theme", nonEmpty: true }],
          transform: (value) => toThemeClassName(value),
          default: "theme-default"
        }
      }
    }
  }
};
