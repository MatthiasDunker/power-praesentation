import type { CoreTemplateId, OutlineItem } from "@power/contracts";

const templateCatalog: Record<CoreTemplateId, { intents: string[]; weight: number }> = {
  "title-hero": { intents: ["intro", "open", "headline", "hero"], weight: 3 },
  "section-divider": { intents: ["section", "transition", "chapter"], weight: 3 },
  "bullet-list": { intents: ["list", "steps", "agenda", "overview"], weight: 2 },
  "two-column": { intents: ["compare", "versus", "tradeoff", "split"], weight: 3 },
  "multi-column": { intents: ["matrix", "framework", "dimensions", "quadrant"], weight: 2 },
  "quote-focus": { intents: ["quote", "testimonial", "voice"], weight: 2 },
  "image-left-copy": { intents: ["visual", "image", "photo", "example"], weight: 2 },
  "image-right-copy": { intents: ["visual", "image", "photo", "example"], weight: 2 },
  "metric-highlight": { intents: ["metric", "kpi", "number", "impact", "result"], weight: 3 }
};

export interface RankedTemplate {
  templateId: CoreTemplateId;
  score: number;
}

export interface TemplateMatchResult {
  selected: CoreTemplateId;
  ranked: RankedTemplate[];
  usedTieBreak: boolean;
}

function scoreTemplate(item: OutlineItem, templateId: CoreTemplateId): number {
  const lowered = `${item.title} ${item.summary} ${item.intent}`.toLowerCase();
  const catalog = templateCatalog[templateId];
  const keywordHits = catalog.intents.reduce((count, keyword) => {
    return lowered.includes(keyword) ? count + 1 : count;
  }, 0);

  let base = keywordHits * catalog.weight;

  if (templateId === "bullet-list" && lowered.includes("-")) {
    base += 1;
  }

  if (templateId === "two-column" && /versus|vs\.|compare|tradeoff/.test(lowered)) {
    base += 2;
  }

  if (templateId === "multi-column" && /matrix|quadrant|2x2|framework/.test(lowered)) {
    base += 2;
  }

  return base;
}

export function rankTemplates(item: OutlineItem): RankedTemplate[] {
  const ranked = (Object.keys(templateCatalog) as CoreTemplateId[]).map((templateId) => ({
    templateId,
    score: scoreTemplate(item, templateId)
  }));

  return ranked.sort((left, right) => right.score - left.score);
}

export async function selectTemplate(
  item: OutlineItem,
  tieBreak?: (
    candidates: CoreTemplateId[],
    item: OutlineItem
  ) => Promise<CoreTemplateId>
): Promise<TemplateMatchResult> {
  const ranked = rankTemplates(item);
  const bestScore = ranked[0]?.score ?? 0;
  const candidates = ranked.filter((entry) => entry.score === bestScore).map((entry) => entry.templateId);

  if (candidates.length > 1 && tieBreak) {
    const selected = await tieBreak(candidates, item);
    return {
      selected,
      ranked,
      usedTieBreak: true
    };
  }

  return {
    selected: candidates[0] ?? "bullet-list",
    ranked,
    usedTieBreak: false
  };
}
