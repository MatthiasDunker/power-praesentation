import type { SlideAstInput, SlideDecodeResult } from "../../types";

export interface BulletListTemplateProps {
  title: string;
  subtitle?: string;
  bullets: string[];
  notes: string[];
}

export function decodeBulletList(
  input: SlideAstInput
): SlideDecodeResult<BulletListTemplateProps> {
  const lines = input.contentMarkdown.split(/\r?\n/);
  let title = "Overview";
  let subtitle: string | undefined;
  const bullets: string[] = [];
  const notes: string[] = [];

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();
    if (!trimmed) {
      continue;
    }

    if (trimmed.startsWith("# ")) {
      title = trimmed.slice(2).trim() || title;
      continue;
    }

    if (!subtitle && trimmed.startsWith("## ")) {
      subtitle = trimmed.slice(3).trim() || undefined;
      continue;
    }

    const unordered = trimmed.match(/^[-*+]\s+(.+)$/);
    const ordered = trimmed.match(/^\d+\.\s+(.+)$/);
    const bullet = unordered?.[1] ?? ordered?.[1];
    if (bullet) {
      bullets.push(bullet.trim());
      continue;
    }

    if (!trimmed.startsWith("### ")) {
      notes.push(trimmed);
    }
  }

  return {
    props: {
      title,
      subtitle,
      bullets,
      notes
    },
    warnings: []
  };
}
