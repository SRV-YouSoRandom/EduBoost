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

// Define a new schema for the prompt's input, including the pre-serialized JSON string
// For currentStrategyJson, pass only the AI-relevant parts (text, search volumes for keywords, and the markdown strings)
const CurrentStrategyForPromptSchema = z.object({
    keywordSuggestions: z.array(AIKeywordSuggestionSchema).describe('The current keyword suggestions, only text and search volumes.'),
    descriptionSuggestions: z.string().describe('Current GMB description markdown.'),
    optimizationTips: z.string().describe('Current GMB optimization tips markdown.')
});

const RefineGMBOptimizationsPromptInputInternalSchema = RefineGMBOptimizationsInputSchema.extend({
  currentStrategyJson: z.string().describe("The existing GMB optimization strategy's relevant parts as a JSON string.")
});


const refinePrompt = ai.definePrompt({
  name: 'refineGMBOptimizationsPrompt',
  input: { schema: RefineGMBOptimizationsPromptInputInternalSchema }, 
  output: { schema: GMBAIPromptOutputSchema }, 
  prompt: `You are an expert in Google My Business (GMB) optimization.
You are given an existing GMB optimization strategy and a user prompt asking for modifications.

Institution Context:
  Name: {{institutionContext.institutionName}}
  Type: {{institutionContext.institutionType}}
  Location: {{institutionContext.location}}
  Programs Offered: {{institutionContext.programsOffered}}
  Target Audience: {{institutionContext.targetAudience}}
  Unique Selling Points: {{institutionContext.uniqueSellingPoints}}

Existing GMB Strategy (relevant parts):
\`\`\`json
{{{currentStrategyJson}}}
\`\`\`

User's Refinement Request: "{{userPrompt}}"

Based on the user's request, refine the existing strategy. Your goal is to *incorporate the user's feedback into the respective sections (keywordSuggestions, descriptionSuggestions, optimizationTips)*.
- For 'keywordSuggestions': If the user asks to add, remove, or analyze keywords, update the array. *Preserve existing keywords not explicitly targeted for removal or modification.* For new keywords, provide estimated search volumes. *When adding new keywords, append them to the end of the keyword list you generate.* *Return the complete, updated list of keyword objects.*
- For 'descriptionSuggestions' and 'optimizationTips': Modify these markdown strings based on the feedback. *Aim to enhance or correct them rather than completely rewriting, unless necessary.*

Ensure the entire output is a single, valid JSON object conforming to the AI output schema (GMBAIPromptOutputSchema).
For 'keywordSuggestions', each item must be an object with "text", "searchVolumeLast24h", and "searchVolumeLast7d".
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
    // Prepare a simplified version of the current strategy for the AI prompt
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
      return input.currentStrategy;
    }

    const mappedKeywordSuggestions: GMBKeywordSuggestion[] = aiRefinedOutput.keywordSuggestions.map(aiKw => {
        const existingKw = input.currentStrategy.keywordSuggestions.find(
          (currentKw) => currentKw.text.toLowerCase() === aiKw.text.toLowerCase()
        );
        return {
          id: existingKw?.id || crypto.randomUUID(),
          text: aiKw.text,
          status: existingKw?.status || ('pending'as Status), 
          searchVolumeLast24h: aiKw.searchVolumeLast24h,
          searchVolumeLast7d: aiKw.searchVolumeLast7d,
        };
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

