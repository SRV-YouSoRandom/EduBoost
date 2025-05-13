// src/ai/utils/local-seo-mapping-helpers.ts
import { z } from 'zod';
import type { Status } from '@/types/common';
import type { KeywordItemWithStatus } from '@/ai/flows/generate-local-seo-strategy';
// Import the Zod schema constants for use with z.infer
import { AIKeywordSchema, AIKpiSchema } from '@/ai/flows/generate-local-seo-strategy';

export const mapAiKeywordsToItemsWithStatus = (aiKeywords: z.infer<typeof AIKeywordSchema>[]): KeywordItemWithStatus[] => {
  return aiKeywords.map(keyword => ({
    id: crypto.randomUUID(),
    text: keyword.text,
    status: 'pending' as Status,
    searchVolumeLast24h: keyword.searchVolumeLast24h,
    searchVolumeLast7d: keyword.searchVolumeLast7d,
  }));
};

export const mapAiKpisToItemsWithStatus = (aiKpis: z.infer<typeof AIKpiSchema>[]): KeywordItemWithStatus[] => {
  return aiKpis.map(kpi => ({
    id: crypto.randomUUID(),
    text: kpi.text,
    status: 'pending' as Status,
    // searchVolume fields are not applicable for KPIs, will be undefined
  }));
};