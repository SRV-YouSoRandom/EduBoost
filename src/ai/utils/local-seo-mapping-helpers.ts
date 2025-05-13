// src/ai/utils/local-seo-mapping-helpers.ts
import type { Status } from '@/types/common';
import type { KeywordItemWithStatus, AIKeyword, AIKpi } from '@/ai/schemas/local-seo-schemas';


export const mapAiKeywordsToItemsWithStatus = (
  aiKeywords: AIKeyword[],
  existingItems: KeywordItemWithStatus[] = []
): KeywordItemWithStatus[] => {
  if (!aiKeywords) return existingItems; // If AI returns nothing, keep existing
  return aiKeywords.map(aiKw => {
    const existingItem = existingItems.find(
      item => item.text.toLowerCase() === aiKw.text.toLowerCase()
    );
    return {
      id: existingItem?.id || crypto.randomUUID(),
      text: aiKw.text,
      status: existingItem?.status || ('pending' as Status),
      searchVolumeLast24h: aiKw.searchVolumeLast24h,
      searchVolumeLast7d: aiKw.searchVolumeLast7d,
    };
  });
};

export const mapAiKpisToItemsWithStatus = (
  aiKpis: AIKpi[],
  existingItems: KeywordItemWithStatus[] = []
): KeywordItemWithStatus[] => {
  if (!aiKpis) return existingItems; // If AI returns nothing, keep existing
  return aiKpis.map(aiKpi => {
    const existingItem = existingItems.find(
      item => item.text.toLowerCase() === aiKpi.text.toLowerCase()
    );
    return {
      id: existingItem?.id || crypto.randomUUID(),
      text: aiKpi.text,
      status: existingItem?.status || ('pending' as Status),
      // searchVolume fields are not applicable for KPIs
    };
  });
};
