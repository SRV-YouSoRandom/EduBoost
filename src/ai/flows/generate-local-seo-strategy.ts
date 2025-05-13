// src/ai/flows/generate-local-seo-strategy.ts
'use server';

/**
 * @fileOverview Generates a tailored local SEO strategy for educational institutions.
 * The output is a structured JSON object containing different aspects of the strategy.
 *
 * - generateLocalSEOStrategy - A function that generates a local SEO strategy.
 * - GenerateLocalSEOStrategyInput - The input type for the generateLocalSEOStrategy function.
 * - GenerateLocalSEOStrategyOutput - The return type for the generateLocalSEOStrategy function.
 */

import {ai} from '@/ai/genkit';
import { mapAiKeywordsToItemsWithStatus, mapAiKpisToItemsWithStatus } from '@/ai/utils/local-seo-mapping-helpers';
import {
  GenerateLocalSEOStrategyInputSchema,
  GenerateLocalSEOStrategyOutputSchema,
  AIPromptOutputSchema,
} from '@/ai/schemas/local-seo-schemas';
import type { 
  GenerateLocalSEOStrategyInput as LocalSEOInputType, 
  GenerateLocalSEOStrategyOutput as LocalSEOOutputType 
} from '@/ai/schemas/local-seo-schemas';

export type GenerateLocalSEOStrategyInput = LocalSEOInputType;
export type GenerateLocalSEOStrategyOutput = LocalSEOOutputType;

export async function generateLocalSEOStrategy(
  input: GenerateLocalSEOStrategyInput
): Promise<GenerateLocalSEOStrategyOutput> {
  return generateLocalSEOStrategyFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateLocalSEOStrategyPrompt',
  input: {schema: GenerateLocalSEOStrategyInputSchema},
  output: {schema: AIPromptOutputSchema}, // AI outputs the structure defined in AIPromptOutputSchema
  prompt: `You are an expert local SEO strategist specializing in educational institutions, with deep knowledge of Google's SEO tools and best practices.

  Based on the following information:
  Institution Name: {{{institutionName}}}
  Location: {{{location}}}
  Programs Offered: {{{programsOffered}}}
  Target Audience: {{{targetAudience}}}
  Website URL: {{{websiteUrl}}}

  Generate a comprehensive local SEO strategy as a JSON object.
  The JSON object MUST conform to the defined output schema (AI version, referring to AIPromptOutputSchema).
  Each field in the JSON object should contain actionable advice, lists, or summaries as per the schema descriptions.
  For string fields requiring strategic advice, provide concise text. This text can use simple markdown (like bolding for emphasis) if it enhances readability.
  
  For keyword arrays in 'keywordResearch' (primaryKeywords, secondaryKeywords, longTailKeywords), each item MUST be an object with the following fields:
  - "text": The keyword itself.
  - "searchVolumeLast24h": An estimated search volume for this keyword in the institution's location ({{{location}}}) over the last 24 hours. State if data is unavailable or an approximation (e.g., 'approx. 10-20', 'low', 'unavailable').
  - "searchVolumeLast7d": An estimated search volume for this keyword in the institution's location ({{{location}}}) over the last 7 days. State if data is unavailable or an approximation (e.g., 'approx. 100-150', 'medium', 'unavailable').
  
  For the 'kpis' array in 'trackingReporting', each item MUST be an object with the field:
  - "text": The KPI description (e.g., "Increase in local pack rankings for primary keywords").

  Structure your response to populate the following fields according to the AI output schema:
  - executiveSummary
  - keywordResearch (including primaryKeywords, secondaryKeywords, longTailKeywords as arrays of keyword objects with text and search volume estimates, toolsMention)
  - gmbOptimization (covering profileCompleteness, napConsistency, categories, servicesProducts, photosVideos, gmbPosts, qaSection, reviewsStrategy)
  - onPageLocalSEO (covering localizedContent, titleTagsMetaDescriptions, headerTags, imageOptimization, localBusinessSchema)
  - localLinkBuilding (covering localDirectories, communityPartnerships, guestPosting, sponsorships)
  - technicalLocalSEO (covering mobileFriendliness, siteSpeed, citationsNapConsistencyCheck)
  - trackingReporting (covering googleAnalytics, googleSearchConsole, kpis as an array of KPI objects with text)
  - conclusion

  Ensure the entire output is a single, valid JSON object matching the AI schema.
  `,
});


const generateLocalSEOStrategyFlow = ai.defineFlow(
  {
    name: 'generateLocalSEOStrategyFlow',
    inputSchema: GenerateLocalSEOStrategyInputSchema,
    outputSchema: GenerateLocalSEOStrategyOutputSchema,
  },
  async (input): Promise<GenerateLocalSEOStrategyOutput> => {
    const {output: aiOutput} = await prompt(input);
    if (!aiOutput) {
      console.error("AI failed to generate valid structured output for Local SEO Strategy.");
      // Return a structured error object matching the schema
      return {
        executiveSummary: "Error: Failed to generate executive summary.",
        keywordResearch: { primaryKeywords: [], secondaryKeywords: [], longTailKeywords: [], toolsMention: "N/A" },
        gmbOptimization: { profileCompleteness: "Error", napConsistency: "Error", categories: "Error", servicesProducts: "Error", photosVideos: "Error", gmbPosts: "Error", qaSection: "Error", reviewsStrategy: "Error" },
        onPageLocalSEO: { localizedContent: "Error", titleTagsMetaDescriptions: "Error", headerTags: "Error", imageOptimization: "Error", localBusinessSchema: "Error" },
        localLinkBuilding: { localDirectories: "Error", communityPartnerships: "Error", guestPosting: "Error", sponsorships: "Error" },
        technicalLocalSEO: { mobileFriendliness: "Error", siteSpeed: "Error", citationsNapConsistencyCheck: "Error" },
        trackingReporting: { googleAnalytics: "Error", googleSearchConsole: "Error", kpis: [] },
        conclusion: "Error: Failed to generate conclusion.",
      };
    }

    return {
      executiveSummary: aiOutput.executiveSummary,
      keywordResearch: {
        primaryKeywords: mapAiKeywordsToItemsWithStatus(aiOutput.keywordResearch.primaryKeywords),
        secondaryKeywords: mapAiKeywordsToItemsWithStatus(aiOutput.keywordResearch.secondaryKeywords),
        longTailKeywords: mapAiKeywordsToItemsWithStatus(aiOutput.keywordResearch.longTailKeywords),
        toolsMention: aiOutput.keywordResearch.toolsMention,
      },
      gmbOptimization: aiOutput.gmbOptimization,
      onPageLocalSEO: aiOutput.onPageLocalSEO,
      localLinkBuilding: aiOutput.localLinkBuilding,
      technicalLocalSEO: aiOutput.technicalLocalSEO,
      trackingReporting: {
        googleAnalytics: aiOutput.trackingReporting.googleAnalytics,
        googleSearchConsole: aiOutput.trackingReporting.googleSearchConsole,
        kpis: mapAiKpisToItemsWithStatus(aiOutput.trackingReporting.kpis),
      },
      conclusion: aiOutput.conclusion,
    };
  }
);
