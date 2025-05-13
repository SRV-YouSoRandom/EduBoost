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
} from '@/ai/schemas/local-seo-schemas';
import type { 
  RefineLocalSEOStrategyInput as RefineInputType, 
  GenerateLocalSEOStrategyOutput as LocalSEOOutputType,
  GenerateLocalSEOStrategyInput, 
} from '@/ai/schemas/local-seo-schemas';
import { z } from 'zod';

export type RefineLocalSEOStrategyInput = RefineInputType;
export type GenerateLocalSEOStrategyOutput = LocalSEOOutputType; 

export async function refineLocalSEOStrategy(
  input: RefineLocalSEOStrategyInput
): Promise<GenerateLocalSEOStrategyOutput> {
  return refineLocalSEOStrategyFlow(input);
}

// Define a new schema for the prompt's input, including the pre-serialized JSON string
const RefineLocalSEOStrategyPromptInputInternalSchema = RefineLocalSEOStrategyInputSchema.extend({
  currentStrategyJson: z.string().describe("The existing Local SEO strategy as a JSON string.")
});

const refinePrompt = ai.definePrompt({
  name: 'refineLocalSEOStrategyPrompt',
  input: {schema: RefineLocalSEOStrategyPromptInputInternalSchema}, // Use the internal schema
  output: {schema: AIPromptOutputSchema}, 
  prompt: `You are an expert local SEO strategist. You are given an existing Local SEO strategy for an educational institution and a user prompt asking for modifications.
Institution Context:
  Name: {{institutionContext.institutionName}}
  Location: {{institutionContext.location}}
  Programs Offered: {{institutionContext.programsOffered}}
  Target Audience: {{institutionContext.targetAudience}}
  Website URL: {{institutionContext.websiteUrl}}

Existing Strategy:
\`\`\`json
{{{currentStrategyJson}}}
\`\`\`

User's Refinement Request: "{{userPrompt}}"

Based on the user's request, refine the existing strategy.
- If the user asks to add or analyze keywords, update the 'keywordResearch' section accordingly. Provide estimated search volumes for new keywords if possible, similar to the existing format. Preserve existing keywords unless specified otherwise.
- If the request concerns other sections (e.g., GMB, on-page SEO, link building), modify those parts.
- Ensure the entire output is a single, valid JSON object conforming to the AI output schema (AIPromptOutputSchema).
- Maintain the overall structure.
- For keyword arrays in 'keywordResearch' (primaryKeywords, secondaryKeywords, longTailKeywords), each item MUST be an object with "text", "searchVolumeLast24h", and "searchVolumeLast7d".
- For the 'kpis' array in 'trackingReporting', each item MUST be an object with "text".

Return the complete, updated strategy as a JSON object.
  `,
  // Removed helpers block as jsonEncode is no longer used
});

const refineLocalSEOStrategyFlow = ai.defineFlow(
  {
    name: 'refineLocalSEOStrategyFlow',
    inputSchema: RefineLocalSEOStrategyInputSchema, // External input schema remains the same
    outputSchema: GenerateLocalSEOStrategyOutputSchema, 
  },
  async (input): Promise<GenerateLocalSEOStrategyOutput> => {
    // Pre-serialize currentStrategy to a JSON string
    const currentStrategyJsonString = JSON.stringify(input.currentStrategy, null, 2);

    const promptInput = {
      ...input,
      currentStrategyJson: currentStrategyJsonString,
    };

    const {output: aiRefinedOutput} = await refinePrompt(promptInput);

    if (!aiRefinedOutput) {
      console.error("AI failed to generate valid structured output for Local SEO Strategy refinement.");
      throw new Error("Failed to refine local SEO strategy. The AI model did not return the expected data structure.");
    }
    
    return {
      executiveSummary: aiRefinedOutput.executiveSummary,
      keywordResearch: {
        primaryKeywords: mapAiKeywordsToItemsWithStatus(aiRefinedOutput.keywordResearch.primaryKeywords),
        secondaryKeywords: mapAiKeywordsToItemsWithStatus(aiRefinedOutput.keywordResearch.secondaryKeywords),
        longTailKeywords: mapAiKeywordsToItemsWithStatus(aiRefinedOutput.keywordResearch.longTailKeywords),
        toolsMention: aiRefinedOutput.keywordResearch.toolsMention,
      },
      gmbOptimization: aiRefinedOutput.gmbOptimization,
      onPageLocalSEO: aiRefinedOutput.onPageLocalSEO,
      localLinkBuilding: aiRefinedOutput.localLinkBuilding,
      technicalLocalSEO: aiRefinedOutput.technicalLocalSEO,
      trackingReporting: {
        googleAnalytics: aiRefinedOutput.trackingReporting.googleAnalytics,
        googleSearchConsole: aiRefinedOutput.trackingReporting.googleSearchConsole,
        kpis: mapAiKpisToItemsWithStatus(aiRefinedOutput.trackingReporting.kpis),
      },
      conclusion: aiRefinedOutput.conclusion,
    };
  }
);
