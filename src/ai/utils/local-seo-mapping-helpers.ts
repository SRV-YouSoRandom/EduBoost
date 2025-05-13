// src/ai/utils/local-seo-mapping-helpers.ts
import type { z } from 'zod'; // z.infer needs z
import type { Status } from '@/types/common';
import type { KeywordItemWithStatus, AIKeyword, AIKpi } from '@/ai/schemas/local-seo-schemas';
// Import the Zod schema constants for use with z.infer if needed for type inference inside this file,
// or rely on the imported types like AIKeyword and AIKpi directly.
// For z.infer<typeof AIKeywordSchema> type usage, AIKeywordSchema needs to be imported if not using pre-inferred type.
// Since we've defined AIKeyword and AIKpi types in the schema file, we can use those.

export const mapAiKeywordsToItemsWithStatus = (aiKeywords: AIKeyword[]): KeywordItemWithStatus[] => {
  return aiKeywords.map(keyword => ({
    id: crypto.randomUUID(),
    text: keyword.text,
    status: 'pending' as Status,
    searchVolumeLast24h: keyword.searchVolumeLast24h,
    searchVolumeLast7d: keyword.searchVolumeLast7d,
  }));
};

export const mapAiKpisToItemsWithStatus = (aiKpis: AIKpi[]): KeywordItemWithStatus[] => {
  return aiKpis.map(kpi => ({
    id: crypto.randomUUID(),
    text: kpi.text,
    status: 'pending' as Status,
    // searchVolume fields are not applicable for KPIs, will be undefined
  }));
};
