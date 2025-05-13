// src/ai/flows/refine-local-seo-strategy.ts
'use server';
/**
 * @fileOverview Refines an existing Local SEO strategy based on user prompts.
 *
 * - refineLocalSEOStrategy - A function that takes an existing strategy and a user prompt to generate a refined strategy.
 * - RefineLocalSEOStrategyInput - The input type for the refineLocalSEOStrategy function.
 * - GenerateLocalSEOStrategyOutput - The return type (re-uses the output schema from the generation flow).
 */

import {ai} from '@/ai/genkit';
import { mapAiKeywordsToItemsWithStatus, mapAiKpisToItemsWithStatus } from '@/ai/utils/local-seo-mapping-helpers';
import {
  RefineLocalSEOStrategyInputSchema,
  GenerateLocalSEOStrategyOutputSchema,
  AIPromptOutputSchema,
  GenerateLocalSEOStrategyInputSchema, // For institutionContext
  AIKeywordResearchSchema, // For simplified current strategy
  AITrackingReportingSchema, // For simplified current strategy
  GMBOptimizationSchema,
  OnPageSEOSchema,
  LocalLinkBuildingSchema,
  TechnicalLocalSEOSchema,
} from '@/ai/schemas/local-seo-schemas';
import type { 
  RefineLocalSEOStrategyInput as RefineInputType, 
  GenerateLocalSEOStrategyOutput as LocalSEOOutputType,
} from '@/ai/schemas/local-seo-schemas';
import { z } from 'zod';

export type RefineLocalSEOStrategyInput = RefineInputType;
export type GenerateLocalSEOStrategyOutput = LocalSEOOutputType; 

export async function refineLocalSEOStrategy(
  input: RefineLocalSEOStrategyInput
): Promise<GenerateLocalSEOStrategyOutput> {
  return refineLocalSEOStrategyFlow(input);
}

// Schema for the relevant parts of the current strategy to be passed to the AI
const CurrentStrategyForPromptSimplifiedSchema = z.object({
  executiveSummary: z.string(),
  keywordResearch: AIKeywordResearchSchema, // Uses AIKeywordSchema internally, no IDs/statuses
  gmbOptimization: GMBOptimizationSchema,
  onPageLocalSEO: OnPageSEOSchema,
  localLinkBuilding: LocalLinkBuildingSchema,
  technicalLocalSEO: TechnicalLocalSEOSchema,
  trackingReporting: AITrackingReportingSchema, // Uses AIKpiSchema internally
  conclusion: z.string(),
});


const RefineLocalSEOStrategyPromptInputInternalSchema = RefineLocalSEOStrategyInputSchema.extend({
  currentStrategyJson: z.string().describe("The relevant parts of the existing Local SEO strategy as a JSON string.")
});

const refinePrompt = ai.definePrompt({
  name: 'refineLocalSEOStrategyPrompt',
  input: {schema: RefineLocalSEOStrategyPromptInputInternalSchema}, 
  output: {schema: AIPromptOutputSchema}, 
  prompt: `You are an expert local SEO strategist. You are given an existing Local SEO strategy for an educational institution and a user prompt asking for modifications.
Institution Context:
  Name: {{institutionContext.institutionName}}
  Location: {{institutionContext.location}}
  Programs Offered: {{institutionContext.programsOffered}}
  Target Audience: {{institutionContext.targetAudience}}
  Website URL: {{institutionContext.websiteUrl}}

Existing Strategy (relevant parts):
\`\`\`json
{{{currentStrategyJson}}}
\`\`\`

User's Refinement Request: "{{userPrompt}}"

Based on the user's request, refine the existing strategy. Your goal is to *incorporate the user's feedback into the respective sections of the strategy*.
- For 'keywordResearch': If the user asks to add, remove, or analyze keywords, update the 'primaryKeywords', 'secondaryKeywords', or 'longTailKeywords' arrays. *Preserve existing keywords not explicitly targeted for removal or modification.* For new keywords, provide estimated search volumes. *Return the complete, updated list of keyword objects for each category.*
- For 'kpis' in 'trackingReporting': If the user requests changes to KPIs, update the list. *Preserve existing KPIs not targeted for modification. Return the complete, updated list of KPI objects.*
- For other sections (e.g., executiveSummary, gmbOptimization, onPageLocalSEO, etc.): Modify these parts based on the feedback. *Aim to enhance or correct them rather than completely rewriting unless necessary.*

Ensure the entire output is a single, valid JSON object conforming to the AI output schema (AIPromptOutputSchema).
For keyword arrays in 'keywordResearch' (primaryKeywords, secondaryKeywords, longTailKeywords), each item MUST be an object with "text", "searchVolumeLast24h", and "searchVolumeLast7d".
For the 'kpis' array in 'trackingReporting', each item MUST be an object with "text".

Return the complete, updated strategy as a JSON object.
  `,
});

const refineLocalSEOStrategyFlow = ai.defineFlow(
  {
    name: 'refineLocalSEOStrategyFlow',
    inputSchema: RefineLocalSEOStrategyInputSchema, 
    outputSchema: GenerateLocalSEOStrategyOutputSchema, 
  },
  async (input): Promise<GenerateLocalSEOStrategyOutput> => {
    // Simplify the current strategy for the AI prompt, removing IDs and statuses
    const simplifiedCurrentStrategy = {
      executiveSummary: input.currentStrategy.executiveSummary,
      keywordResearch: {
        primaryKeywords: input.currentStrategy.keywordResearch.primaryKeywords.map(kw => ({ text: kw.text, searchVolumeLast24h: kw.searchVolumeLast24h, searchVolumeLast7d: kw.searchVolumeLast7d })),
        secondaryKeywords: input.currentStrategy.keywordResearch.secondaryKeywords.map(kw => ({ text: kw.text, searchVolumeLast24h: kw.searchVolumeLast24h, searchVolumeLast7d: kw.searchVolumeLast7d })),
        longTailKeywords: input.currentStrategy.keywordResearch.longTailKeywords.map(kw => ({ text: kw.text, searchVolumeLast24h: kw.searchVolumeLast24h, searchVolumeLast7d: kw.searchVolumeLast7d })),
        toolsMention: input.currentStrategy.keywordResearch.toolsMention,
      },
      gmbOptimization: input.currentStrategy.gmbOptimization,
      onPageLocalSEO: input.currentStrategy.onPageLocalSEO,
      localLinkBuilding: input.currentStrategy.localLinkBuilding,
      technicalLocalSEO: input.currentStrategy.technicalLocalSEO,
      trackingReporting: {
        googleAnalytics: input.currentStrategy.trackingReporting.googleAnalytics,
        googleSearchConsole: input.currentStrategy.trackingReporting.googleSearchConsole,
        kpis: input.currentStrategy.trackingReporting.kpis.map(kpi => ({ text: kpi.text })),
      },
      conclusion: input.currentStrategy.conclusion,
    };
    const currentStrategyJsonString = JSON.stringify(simplifiedCurrentStrategy, null, 2);

    const promptInput = {
      ...input,
      currentStrategyJson: currentStrategyJsonString,
    };

    const {output: aiRefinedOutput} = await refinePrompt(promptInput);

    if (!aiRefinedOutput) {
      console.error("AI failed to generate valid structured output for Local SEO Strategy refinement. Returning original strategy.");
      return input.currentStrategy;
    }
    
    return {
      executiveSummary: aiRefinedOutput.executiveSummary,
      keywordResearch: {
        primaryKeywords: mapAiKeywordsToItemsWithStatus(aiRefinedOutput.keywordResearch.primaryKeywords, input.currentStrategy.keywordResearch.primaryKeywords),
        secondaryKeywords: mapAiKeywordsToItemsWithStatus(aiRefinedOutput.keywordResearch.secondaryKeywords, input.currentStrategy.keywordResearch.secondaryKeywords),
        longTailKeywords: mapAiKeywordsToItemsWithStatus(aiRefinedOutput.keywordResearch.longTailKeywords, input.currentStrategy.keywordResearch.longTailKeywords),
        toolsMention: aiRefinedOutput.keywordResearch.toolsMention,
      },
      gmbOptimization: aiRefinedOutput.gmbOptimization,
      onPageLocalSEO: aiRefinedOutput.onPageLocalSEO,
      localLinkBuilding: aiRefinedOutput.localLinkBuilding,
      technicalLocalSEO: aiRefinedOutput.technicalLocalSEO,
      trackingReporting: {
        googleAnalytics: aiRefinedOutput.trackingReporting.googleAnalytics,
        googleSearchConsole: aiRefinedOutput.trackingReporting.googleSearchConsole,
        kpis: mapAiKpisToItemsWithStatus(aiRefinedOutput.trackingReporting.kpis, input.currentStrategy.trackingReporting.kpis),
      },
      conclusion: aiRefinedOutput.conclusion,
    };
  }
);
