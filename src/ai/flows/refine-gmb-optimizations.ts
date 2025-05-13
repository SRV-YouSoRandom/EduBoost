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
} from '@/ai/schemas/gmb-optimizer-schemas';

export type { RefineGMBOptimizationsInput, GenerateGMBOptimizationsOutput } from '@/ai/schemas/gmb-optimizer-schemas';

export async function refineGMBOptimizations(
  input: import('@/ai/schemas/gmb-optimizer-schemas').RefineGMBOptimizationsInput
): Promise<import('@/ai/schemas/gmb-optimizer-schemas').GenerateGMBOptimizationsOutput> {
  return refineGMBOptimizationsFlow(input);
}

const refinePrompt = ai.definePrompt({
  name: 'refineGMBOptimizationsPrompt',
  input: { schema: RefineGMBOptimizationsInputSchema },
  output: { schema: GMBAIPromptOutputSchema }, // AI returns the "raw" structure, mapping happens in flow
  prompt: `You are an expert in Google My Business (GMB) optimization.
You are given an existing GMB optimization strategy and a user prompt asking for modifications.

Institution Context:
  Name: {{institutionContext.institutionName}}
  Type: {{institutionContext.institutionType}}
  Location: {{institutionContext.location}}
  Programs Offered: {{institutionContext.programsOffered}}
  Target Audience: {{institutionContext.targetAudience}}
  Unique Selling Points: {{institutionContext.uniqueSellingPoints}}

Existing GMB Strategy:
\`\`\`json
{{{jsonEncode currentStrategy}}}
\`\`\`

User's Refinement Request: "{{userPrompt}}"

Based on the user's request, refine the existing strategy.
- If the user asks to add, remove, or analyze keywords, update the 'keywordSuggestions' array. Preserve existing keywords not mentioned in the prompt. For new keywords, provide estimated search volumes if possible (e.g., "approx 10 searches", "low", "unavailable").
- If the request concerns 'descriptionSuggestions' or 'optimizationTips', modify those markdown strings.
- Ensure the entire output is a single, valid JSON object conforming to the AI output schema (GMBAIPromptOutputSchema).
- For 'keywordSuggestions', each item must be an object with "text", "searchVolumeLast24h", and "searchVolumeLast7d".
- Try to incorporate the user's feedback directly into the relevant sections.

Return the complete, updated GMB strategy sections as a JSON object.
  `,
  helpers: {
    jsonEncode: (context: any) => JSON.stringify(context, null, 2),
  }
});

const refineGMBOptimizationsFlow = ai.defineFlow(
  {
    name: 'refineGMBOptimizationsFlow',
    inputSchema: RefineGMBOptimizationsInputSchema,
    outputSchema: GenerateGMBOptimizationsOutputSchema,
  },
  async (input): Promise<import('@/ai/schemas/gmb-optimizer-schemas').GenerateGMBOptimizationsOutput> => {
    const { output: aiRefinedOutput } = await refinePrompt(input);

    if (!aiRefinedOutput || !aiRefinedOutput.keywordSuggestions || !aiRefinedOutput.descriptionSuggestions || !aiRefinedOutput.optimizationTips) {
      console.error("AI failed to generate valid structured output for GMB refinement.");
      // Return the original strategy or a structured error
      // For now, returning a modified version of original with error messages.
      return {
        ...input.currentStrategy, // Spread original strategy
        descriptionSuggestions: "Error: Could not refine description. Original preserved.",
        optimizationTips: "Error: Could not refine tips. Original preserved.",
        // Decide how to handle keywords if they fail. Maybe keep original?
        // For simplicity, if AI output is malformed, we could return the original.
      };
    }

    // Map AI-generated keywords to GMBKeywordSuggestion with ID and status
    // This will generate new IDs for all keywords, even existing ones, if the AI regenerates the list.
    // A more sophisticated approach would be to merge based on keyword text if IDs are not stable from AI.
    const mappedKeywordSuggestions: GMBKeywordSuggestion[] = aiRefinedOutput.keywordSuggestions.map(kw => ({
      id: crypto.randomUUID(),
      text: kw.text,
      status: 'pending' as Status, // Reset status for refined/new keywords
      searchVolumeLast24h: kw.searchVolumeLast24h,
      searchVolumeLast7d: kw.searchVolumeLast7d,
    }));

    return {
      keywordSuggestions: mappedKeywordSuggestions,
      keywordSuggestionsSectionStatus: input.currentStrategy.keywordSuggestionsSectionStatus, // Preserve original section status or reset to pending
      descriptionSuggestions: aiRefinedOutput.descriptionSuggestions,
      descriptionSuggestionsStatus: input.currentStrategy.descriptionSuggestionsStatus, // Preserve or reset
      optimizationTips: aiRefinedOutput.optimizationTips,
      optimizationTipsStatus: input.currentStrategy.optimizationTipsStatus, // Preserve or reset
    };
  }
);
