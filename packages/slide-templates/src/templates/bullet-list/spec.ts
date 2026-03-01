import { asNonEmptyString, toStringArray } from "../../decode-engine";
import type { SlideContainerRule, SlideTemplateDefinition } from "../../types";

export const bulletListContainerRules: readonly SlideContainerRule[] = [];

export interface BulletListTemplateProps {
  title: string;
  subtitle?: string;
  bullets: string[];
  notes: string[];
}

export const bulletListTemplateDefinition: SlideTemplateDefinition<BulletListTemplateProps> = {
  id: "bullet-list",
  containerRules: bulletListContainerRules,
  decoder: {
    kind: "schema",
    schema: {
      fields: {
        title: {
          sources: [{ kind: "heading", depth: 1, nonEmpty: true }],
          transform: (value) => asNonEmptyString(value),
          default: "Overview",
          required: true
        },
        subtitle: {
          sources: [{ kind: "heading", depth: 2, nonEmpty: true }],
          transform: (value) => asNonEmptyString(value)
        },
        bullets: {
          sources: [{ kind: "listItems" }],
          transform: (value) => toStringArray(value),
          default: []
        },
        notes: {
          sources: [{ kind: "paragraphs" }],
          transform: (value) => toStringArray(value),
          default: []
        }
      }
    }
  }
};
