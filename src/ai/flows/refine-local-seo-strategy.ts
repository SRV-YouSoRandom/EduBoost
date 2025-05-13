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
  AIKeywordResearchSchema, 
  AITrackingReportingSchema, 
  GMBOptimizationSchema,
  OnPageSEOSchema,
  LocalLinkBuildingSchema,
  TechnicalLocalSEOSchema,
  AIKeywordSchema, // For individual keyword object from AI
  AIKpiSchema, // For individual KPI object from AI
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

const CurrentStrategyForPromptSimplifiedSchema = z.object({
  executiveSummary: z.string(),
  keywordResearch: AIKeywordResearchSchema, 
  gmbOptimization: GMBOptimizationSchema,
  onPageLocalSEO: OnPageSEOSchema,
  localLinkBuilding: LocalLinkBuildingSchema,
  technicalLocalSEO: TechnicalLocalSEOSchema,
  trackingReporting: AITrackingReportingSchema, 
  conclusion: z.string(),
});


const RefineLocalSEOStrategyPromptInputInternalSchema = RefineLocalSEOStrategyInputSchema.extend({
  currentStrategyJson: z.string().describe("The relevant parts of the existing Local SEO strategy (keywords/KPIs without IDs/status, text sections) as a JSON string.")
});

const refinePrompt = ai.definePrompt({
  name: 'refineLocalSEOStrategyPrompt',
  input: {schema: RefineLocalSEOStrategyPromptInputInternalSchema}, 
  output: {schema: AIPromptOutputSchema}, 
  prompt: `You are an expert local SEO strategist, specializing in educational institutions and Google's SEO tools.
You are given an existing Local SEO strategy and a user prompt asking for modifications. Your task is to intelligently incorporate the user's feedback.

Institution Context:
  Name: {{institutionContext.institutionName}}
  Location: {{institutionContext.location}}
  Programs Offered: {{institutionContext.programsOffered}}
  Target Audience: {{institutionContext.targetAudience}}
  Website URL: {{institutionContext.websiteUrl}}

Existing Strategy (relevant parts for AI processing - keywords/KPIs are simplified):
\`\`\`json
{{{currentStrategyJson}}}
\`\`\`

User's Refinement Request: "{{userPrompt}}"

Based on the user's request, refine the existing strategy. Your goal is to *intelligently incorporate the user's feedback into the respective sections of the strategy*.
- **Keyword Research ('keywordResearch'):**
    - If the user asks to add, remove, or analyze keywords, update the 'primaryKeywords', 'secondaryKeywords', or 'longTailKeywords' arrays.
    - *Preserve existing keywords from 'currentStrategyJson.keywordResearch' within their respective categories (primary, secondary, long-tail) unless the user's prompt clearly implies they should be removed or modified from that category.*
    - For new keywords, provide *estimated* search volumes ('approx. X-Y', 'low', 'medium', 'high', 'unavailable').
    - *When adding new keywords, append them to the end of the respective keyword list you generate (primary, secondary, or long-tail).*
    - The final 'keywordResearch' object should contain complete, updated lists of keyword objects for each category, each with "text", "searchVolumeLast24h", and "searchVolumeLast7d".
- **KPIs ('kpis' in 'trackingReporting'):**
    - If the user requests changes to KPIs, update the list.
    - *Preserve existing KPIs from 'currentStrategyJson.trackingReporting.kpis' not explicitly targeted for modification.*
    - *When adding new KPIs, append them to the end of the KPI list you generate.*
    - The final 'kpis' array should be a complete, updated list of KPI objects, each with "text".
- **Other Text Sections (e.g., executiveSummary, gmbOptimization parts, onPageLocalSEO parts, etc.):**
    - Modify these text parts based on the user's feedback.
    - *Aim to enhance, correct, or add to the existing text, integrating the user's request naturally. Avoid complete rewrites unless the user explicitly asks for a full rewrite of a specific section or the current text is very brief/irrelevant to the prompt.*
    - For example, if the user asks to "add more detail about GMB posts", expand the 'gmbPosts' field within 'gmbOptimization' with more specific advice.

Ensure the entire output is a single, valid JSON object conforming to the AIPromptOutputSchema.
Return the complete, updated strategy sections as a JSON object.
  `,
});

const refineLocalSEOStrategyFlow = ai.defineFlow(
  {
    name: 'refineLocalSEOStrategyFlow',
    inputSchema: RefineLocalSEOStrategyInputSchema, 
    outputSchema: GenerateLocalSEOStrategyOutputSchema, 
  },
  async (input): Promise<GenerateLocalSEOStrategyOutput> => {
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
      return input.currentStrategy; // Return original strategy if AI fails
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
