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
  prompt: `You are an expert performance marketing strategist with deep experience in Google Marketing Platform tools.
You are given an existing performance marketing strategy document (in markdown format) and a user prompt asking for specific modifications.
Your task is to intelligently update the existing markdown document based on the user's request, ensuring the advice aligns with Google's best practices.

Institution Context (use this to ensure refinements are relevant):
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
Your goal is to *integrate the user's feedback into the document, modifying or expanding relevant sections as needed, while maintaining the overall structure and focusing on Google Marketing Platform tools*.

-   **Targeted Modifications:** Identify the specific section(s) of the document the user's prompt relates to (e.g., Google Ads campaigns, budget allocation, KPIs, content suggestions).
-   **Integration, Not Full Rewrite:**
    *   If the user asks to "focus more on YouTube Ads," expand the YouTube Ads subsection within "Recommended Platforms & Google Ads Campaign Strategy" with more specific recommendations for ad formats, targeting, and content, referencing Google Ads capabilities.
    *   If they ask to "suggest different KPIs for lead quality," update the "Key Performance Indicators (KPIs) & Tracking with Google Analytics" section, perhaps adding new KPIs or modifying existing ones, explaining how they can be tracked in Google Analytics.
    *   If the user provides new information (e.g., "we now have a new program: 'Data Science Masters'"), incorporate this by suggesting how to add a new Google Ads campaign for it or adjust targeting.
    *   *Aim to enhance, correct, or add to the existing document. Do not replace the entire document or large unrelated sections unless the user explicitly asks for a complete rewrite of a specific section.*
-   **Maintain Structure:** Preserve the existing markdown headings and overall flow of the document.
-   **Actionable Advice:** Ensure all new or modified advice is actionable and specific.
-   **Google Focus:** Continue to emphasize Google Marketing Platform tools (Google Ads, Google Analytics) in your refinements.

Return the complete, updated strategy as a single markdown string within the 'marketingStrategyDocument' field.
Use clear headings, bullet points, and bold text for readability as in the original document.
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
