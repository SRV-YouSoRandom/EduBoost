'use server';
/**
 * @fileOverview Refines an existing Performance Marketing strategy document based on user prompts.
 *
 * - refinePerformanceMarketingStrategy - A function that takes an existing strategy document and a user prompt to generate a refined document.
 * - RefinePerformanceMarketingStrategyInput - The input type.
 * - GeneratePerformanceMarketingStrategyOutput - The return type (re-uses the output schema from the generation flow).
 */

import { ai } from '@/ai/genkit';
import type { Status } from '@/types/common';
import {
  RefinePerformanceMarketingStrategyInputSchema,
  GeneratePerformanceMarketingStrategyOutputSchema,
  PerformanceMarketingAIPromptOutputSchema, // AI will output this structure
  GeneratePerformanceMarketingStrategyInputSchema, // For institutionContext
} from '@/ai/schemas/performance-marketing-schemas';

export type { 
  RefinePerformanceMarketingStrategyInput, 
  GeneratePerformanceMarketingStrategyOutput 
} from '@/ai/schemas/performance-marketing-schemas';


export async function refinePerformanceMarketingStrategy(
  input: import('@/ai/schemas/performance-marketing-schemas').RefinePerformanceMarketingStrategyInput
): Promise<import('@/ai/schemas/performance-marketing-schemas').GeneratePerformanceMarketingStrategyOutput> {
  return refinePerformanceMarketingStrategyFlow(input);
}

const refinePrompt = ai.definePrompt({
  name: 'refinePerformanceMarketingStrategyPrompt',
  input: { schema: RefinePerformanceMarketingStrategyInputSchema },
  output: { schema: PerformanceMarketingAIPromptOutputSchema }, // AI returns the refined markdown string
  prompt: `You are an expert performance marketing strategist. You are given an existing performance marketing strategy document and a user prompt asking for modifications.

Institution Context:
  Name: {{institutionContext.institutionName}}
  Type: {{institutionContext.institutionType}}
  Target Audience: {{institutionContext.targetAudience}}
  Programs Offered: {{institutionContext.programsOffered}}
  Location/Target Market: {{institutionContext.location}}
  Marketing Budget: {{institutionContext.marketingBudget}}
  Marketing Goals: {{institutionContext.marketingGoals}}

Existing Performance Marketing Strategy Document (Markdown):
\`\`\`markdown
{{{currentStrategy.marketingStrategyDocument}}}
\`\`\`

User's Refinement Request: "{{userPrompt}}"

Based on the user's request, refine the existing markdown document.
Your goal is to *incorporate the user's feedback into the document, modifying relevant sections as needed*.
- For example, if the user asks to "focus more on YouTube Ads", *expand that section with more specific recommendations*.
- If they ask to "reduce budget for Display Ads", *adjust the budget allocation section and potentially elaborate on the reasoning*.
- *Aim to enhance or correct the existing document, not replace it entirely, unless the user explicitly asks for a rewrite of a specific section.*
Ensure the entire output for 'marketingStrategyDocument' is a single, valid, and comprehensive markdown string, maintaining the overall structure and incorporating the refinements.
Use clear headings, bullet points, and bold text for readability as in the original.

Return the complete, updated strategy as a markdown string within the 'marketingStrategyDocument' field.
  `,
});

const refinePerformanceMarketingStrategyFlow = ai.defineFlow(
  {
    name: 'refinePerformanceMarketingStrategyFlow',
    inputSchema: RefinePerformanceMarketingStrategyInputSchema,
    outputSchema: GeneratePerformanceMarketingStrategyOutputSchema, // Final output matches the original structure
  },
  async (input): Promise<import('@/ai/schemas/performance-marketing-schemas').GeneratePerformanceMarketingStrategyOutput> => {
    const { output: aiRefinedOutput } = await refinePrompt(input);

    if (aiRefinedOutput && aiRefinedOutput.marketingStrategyDocument) {
      return {
        marketingStrategyDocument: aiRefinedOutput.marketingStrategyDocument,
        documentStatus: input.currentStrategy.documentStatus, // Preserve original status
      };
    }
    
    console.error("AI failed to generate refined performance marketing strategy. Returning original.");
    return { // Fallback: return original strategy
      marketingStrategyDocument: input.currentStrategy.marketingStrategyDocument,
      documentStatus: input.currentStrategy.documentStatus,
    };
  }
);
