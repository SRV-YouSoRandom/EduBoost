'use server';
/**
 * @fileOverview Refines an existing GMB Optimization strategy based on user prompts.
 *
 * - refineGMBOptimizations - A function that takes an existing strategy and a user prompt to generate a refined strategy.
 * - RefineGMBOptimizationsInput - The input type for the refineGMBOptimizations function.
 * - GenerateGMBOptimizationsOutput - The return type (re-uses the output schema from the generation flow).
 */

import { ai } from '@/ai/genkit';
import type { Status } from '@/types/common';
import {
  RefineGMBOptimizationsInputSchema,
  GenerateGMBOptimizationsOutputSchema,
  GenerateGMBOptimizationsInputSchema, // For institutionContext
  GMBAIPromptOutputSchema, // AI will output this structure, which then gets mapped
  GMBKeywordSuggestion,
  AIKeywordSuggestionSchema, // Used by GMBAIPromptOutputSchema
} from '@/ai/schemas/gmb-optimizer-schemas';
import { z } from 'zod';

export type { RefineGMBOptimizationsInput, GenerateGMBOptimizationsOutput } from '@/ai/schemas/gmb-optimizer-schemas';

export async function refineGMBOptimizations(
  input: import('@/ai/schemas/gmb-optimizer-schemas').RefineGMBOptimizationsInput
): Promise<import('@/ai/schemas/gmb-optimizer-schemas').GenerateGMBOptimizationsOutput> {
  return refineGMBOptimizationsFlow(input);
}

const CurrentStrategyForPromptSchema = z.object({
    keywordSuggestions: z.array(AIKeywordSuggestionSchema).describe('The current keyword suggestions, only text and search volumes.'),
    descriptionSuggestions: z.string().describe('Current GMB description markdown.'),
    optimizationTips: z.string().describe('Current GMB optimization tips markdown.')
});

const RefineGMBOptimizationsPromptInputInternalSchema = RefineGMBOptimizationsInputSchema.extend({
  currentStrategyJson: z.string().describe("The existing GMB optimization strategy's relevant parts (keywords without IDs/status, description, tips) as a JSON string.")
});


const refinePrompt = ai.definePrompt({
  name: 'refineGMBOptimizationsPrompt',
  input: { schema: RefineGMBOptimizationsPromptInputInternalSchema }, 
  output: { schema: GMBAIPromptOutputSchema }, 
  prompt: `You are an expert in Google My Business (GMB) optimization.
You are given an existing GMB optimization strategy and a user prompt asking for modifications. Your task is to intelligently incorporate the user's feedback.

Institution Context:
  Name: {{institutionContext.institutionName}}
  Type: {{institutionContext.institutionType}}
  Location: {{institutionContext.location}}
  Programs Offered: {{institutionContext.programsOffered}}
  Target Audience: {{institutionContext.targetAudience}}
  Unique Selling Points: {{institutionContext.uniqueSellingPoints}}

Existing GMB Strategy (relevant parts for AI processing - keywords are simplified):
\`\`\`json
{{{currentStrategyJson}}}
\`\`\`

User's Refinement Request: "{{userPrompt}}"

Based on the user's request, refine the existing strategy. Your goal is to *intelligently incorporate the user's feedback into the respective sections (keywordSuggestions, descriptionSuggestions, optimizationTips)*.
- **Keyword Suggestions ('keywordSuggestions'):**
    - If the user asks to add keywords, generate those new keywords along with *estimated* search volumes ('approx. X-Y', 'low', 'medium', 'high', 'unavailable').
    - *Preserve existing keywords from 'currentStrategyJson.keywordSuggestions' unless the user's prompt clearly implies they should be removed or modified.*
    - *Append any newly generated keywords to the end of the keyword list you generate.*
    - The final 'keywordSuggestions' array should contain a mix of preserved and newly generated keywords, each as an object with "text", "searchVolumeLast24h", and "searchVolumeLast7d".
- **Description Suggestions ('descriptionSuggestions') and Optimization Tips ('optimizationTips'):**
    - Modify these markdown strings based on the user's feedback.
    - *Aim to enhance or correct the existing text, integrating the user's request, rather than completely rewriting, unless the user explicitly asks for a full rewrite of a section or the current text is very short/irrelevant.*
    - If the user asks to add specific tips or points to the description, integrate them naturally into the existing markdown structure.

Ensure the entire output is a single, valid JSON object conforming to the GMBAIPromptOutputSchema (which includes 'keywordSuggestions' as an array of AIKeywordSuggestionSchema, 'descriptionSuggestions' as a string, and 'optimizationTips' as a string).
Return the complete, updated GMB strategy sections as a JSON object.
  `,
});

const refineGMBOptimizationsFlow = ai.defineFlow(
  {
    name: 'refineGMBOptimizationsFlow',
    inputSchema: RefineGMBOptimizationsInputSchema, 
    outputSchema: GenerateGMBOptimizationsOutputSchema,
  },
  async (input): Promise<import('@/ai/schemas/gmb-optimizer-schemas').GenerateGMBOptimizationsOutput> => {
    const simplifiedCurrentStrategy = {
      keywordSuggestions: input.currentStrategy.keywordSuggestions.map(kw => ({
        text: kw.text,
        searchVolumeLast24h: kw.searchVolumeLast24h,
        searchVolumeLast7d: kw.searchVolumeLast7d,
      })),
      descriptionSuggestions: input.currentStrategy.descriptionSuggestions,
      optimizationTips: input.currentStrategy.optimizationTips,
    };
    const currentStrategyJsonString = JSON.stringify(simplifiedCurrentStrategy, null, 2);
    
    const promptInput = {
      ...input,
      currentStrategyJson: currentStrategyJsonString,
    };
    
    const { output: aiRefinedOutput } = await refinePrompt(promptInput);

    if (!aiRefinedOutput || !aiRefinedOutput.keywordSuggestions || !aiRefinedOutput.descriptionSuggestions || !aiRefinedOutput.optimizationTips) {
      console.error("AI failed to generate valid structured output for GMB refinement. Returning original strategy.");
      return input.currentStrategy; // Return original if AI fails
    }

    const existingKeywordsMap = new Map(
      input.currentStrategy.keywordSuggestions.map(kw => [kw.text.toLowerCase(), kw])
    );

    const mappedKeywordSuggestions: GMBKeywordSuggestion[] = aiRefinedOutput.keywordSuggestions.map(aiKw => {
        const matchedExistingKw = existingKeywordsMap.get(aiKw.text.toLowerCase());
        if (matchedExistingKw) {
          // If AI returns a keyword that existed, preserve its ID and status
          return {
            ...matchedExistingKw, // Preserves ID, status
            searchVolumeLast24h: aiKw.searchVolumeLast24h, // Update search volumes if AI provided them
            searchVolumeLast7d: aiKw.searchVolumeLast7d,
          };
        } else {
          // This is a new keyword generated by the AI or a significantly rephrased one
          return {
            id: crypto.randomUUID(),
            text: aiKw.text,
            status: 'pending' as Status, 
            searchVolumeLast24h: aiKw.searchVolumeLast24h,
            searchVolumeLast7d: aiKw.searchVolumeLast7d,
          };
        }
    });

    return {
      keywordSuggestions: mappedKeywordSuggestions,
      keywordSuggestionsSectionStatus: input.currentStrategy.keywordSuggestionsSectionStatus, 
      descriptionSuggestions: aiRefinedOutput.descriptionSuggestions,
      descriptionSuggestionsStatus: input.currentStrategy.descriptionSuggestionsStatus,
      optimizationTips: aiRefinedOutput.optimizationTips,
      optimizationTipsStatus: input.currentStrategy.optimizationTipsStatus,
    };
  }
);
