'use server';
/**
 * @fileOverview Refines an existing Local SEO strategy based on user prompts.
 *
 * - refineLocalSEOStrategy - A function that takes an existing strategy and a user prompt to generate a refined strategy.
 * - RefineLocalSEOStrategyInput - The input type for the refineLocalSEOStrategy function.
 * - GenerateLocalSEOStrategyOutput - The return type (re-uses the output schema from the generation flow).
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { 
  GenerateLocalSEOStrategyInputSchema, 
  GenerateLocalSEOStrategyOutputSchema,
  KeywordResearchSchema as AIKeywordResearchSchema, // The AI output for keywords
  GMBOptimizationSchema,
  OnPageSEOSchema,
  LocalLinkBuildingSchema,
  TechnicalLocalSEOSchema,
  AITrackingReportingSchema, // The AI output for tracking
  mapAiKeywordsToItemsWithStatus, // Helper function from generate-local-seo-strategy
  mapAiKpisToItemsWithStatus,      // Helper function from generate-local-seo-strategy
  KeywordItemWithStatusSchema // Used in the final output
} from './generate-local-seo-strategy'; 
import type { GenerateLocalSEOStrategyInput, GenerateLocalSEOStrategyOutput } from './generate-local-seo-strategy';

export const RefineLocalSEOStrategyInputSchema = z.object({
  currentStrategy: GenerateLocalSEOStrategyOutputSchema.describe("The existing Local SEO strategy JSON object."),
  userPrompt: z.string().describe("The user's prompt detailing the desired modifications or additions to the strategy."),
  institutionContext: GenerateLocalSEOStrategyInputSchema.describe("The original context of the educational institution."),
});
export type RefineLocalSEOStrategyInput = z.infer<typeof RefineLocalSEOStrategyInputSchema>;

// The AI will be prompted to output the same structure as the original generation,
// but it will be based on refining the existing strategy.
const AIPromptOutputSchemaForRefinement = z.object({
  executiveSummary: z.string(),
  keywordResearch: AIKeywordResearchSchema, // AI directly outputs this structure
  gmbOptimization: GMBOptimizationSchema,
  onPageLocalSEO: OnPageSEOSchema,
  localLinkBuilding: LocalLinkBuildingSchema,
  technicalLocalSEO: TechnicalLocalSEOSchema,
  trackingReporting: AITrackingReportingSchema, // AI directly outputs this structure
  conclusion: z.string(),
});


export async function refineLocalSEOStrategy(
  input: RefineLocalSEOStrategyInput
): Promise<GenerateLocalSEOStrategyOutput> {
  return refineLocalSEOStrategyFlow(input);
}

const refinePrompt = ai.definePrompt({
  name: 'refineLocalSEOStrategyPrompt',
  input: {schema: RefineLocalSEOStrategyInputSchema},
  output: {schema: AIPromptOutputSchemaForRefinement}, // AI returns the refined structure
  prompt: `You are an expert local SEO strategist. You are given an existing Local SEO strategy for an educational institution and a user prompt asking for modifications.
Institution Context:
  Name: {{institutionContext.institutionName}}
  Location: {{institutionContext.location}}
  Programs Offered: {{institutionContext.programsOffered}}
  Target Audience: {{institutionContext.targetAudience}}
  Website URL: {{institutionContext.websiteUrl}}

Existing Strategy:
\`\`\`json
{{{jsonEncode currentStrategy}}}
\`\`\`

User's Refinement Request: "{{userPrompt}}"

Based on the user's request, refine the existing strategy.
- If the user asks to add or analyze keywords, update the 'keywordResearch' section accordingly. Provide estimated search volumes for new keywords if possible, similar to the existing format. Preserve existing keywords unless specified otherwise.
- If the request concerns other sections (e.g., GMB, on-page SEO, link building), modify those parts.
- Ensure the entire output is a single, valid JSON object conforming to the AI output schema.
- Maintain the overall structure and try to preserve IDs and statuses for items not directly affected by the prompt, if applicable (though for keywords, you'll be generating the text and search volumes).
- For keyword arrays in 'keywordResearch' (primaryKeywords, secondaryKeywords, longTailKeywords), each item MUST be an object with "text", "searchVolumeLast24h", and "searchVolumeLast7d".
- For the 'kpis' array in 'trackingReporting', each item MUST be an object with "text".

Return the complete, updated strategy as a JSON object.
  `,
  // Custom Handlebars helper to stringify the currentStrategy JSON
  helpers: {
    jsonEncode: (context: any) => JSON.stringify(context, null, 2),
  }
});

const refineLocalSEOStrategyFlow = ai.defineFlow(
  {
    name: 'refineLocalSEOStrategyFlow',
    inputSchema: RefineLocalSEOStrategyInputSchema,
    outputSchema: GenerateLocalSEOStrategyOutputSchema, // Final output matches the original structure
  },
  async (input): Promise<GenerateLocalSEOStrategyOutput> => {
    const {output: aiRefinedOutput} = await refinePrompt(input);

    if (!aiRefinedOutput) {
      console.error("AI failed to generate valid structured output for Local SEO Strategy refinement.");
      throw new Error("Failed to refine local SEO strategy. The AI model did not return the expected data structure.");
    }
    
    // Map AI output (which might not have IDs/statuses) to the final schema
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