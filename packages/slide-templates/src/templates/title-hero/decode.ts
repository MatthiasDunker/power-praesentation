import type { SlideAstInput, SlideDecodeResult } from "../../types";

export interface TitleHeroTemplateProps {
  overline?: string;
  title: string;
  text?: string;
  className?: string;
}

function asNonEmpty(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function toThemeClassName(value: string | undefined): string {
  const theme = asNonEmpty(value);
  if (!theme) {
    return "theme-default";
  }

  return theme.startsWith("theme-") ? theme : `theme-${theme}`;
}

export function decodeTitleHero(
  input: SlideAstInput,
): SlideDecodeResult<TitleHeroTemplateProps> {
  const lines = input.contentMarkdown.split(/\r?\n/);
  let overline = asNonEmpty(input.frontmatter.overline);
  let title = asNonEmpty(input.frontmatter.title) ?? "Untitled";
  let text =
    asNonEmpty(input.frontmatter.text) ?? asNonEmpty(input.frontmatter.text);

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();
    if (!trimmed) {
      continue;
    }

    if (trimmed.startsWith("# ")) {
      title = asNonEmpty(trimmed.slice(2)) ?? title;
      continue;
    }

    if (!overline && trimmed.startsWith("## ")) {
      overline = asNonEmpty(trimmed.slice(3));
      continue;
    }

    if (!text && !trimmed.startsWith("### ")) {
      const unordered = /^[-*+]\s+/.test(trimmed);
      const ordered = /^\d+\.\s+/.test(trimmed);
      if (!unordered && !ordered) {
        text = trimmed;
      }
    }
  }

  return {
    props: {
      overline,
      title,
      text,
      className: toThemeClassName(input.frontmatter.theme),
    },
    warnings: [],
  };
}
