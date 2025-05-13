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
  output: {schema: AIPromptOutputSchema}, 
  prompt: `You are an expert local SEO strategist specializing in educational institutions, with deep knowledge of Google's SEO tools (Google Keyword Planner, Google Trends, Google Search Console, Google My Business Insights) and best practices.

  Based on the following information:
  Institution Name: {{{institutionName}}}
  Location: {{{location}}}
  Programs Offered: {{{programsOffered}}}
  Target Audience: {{{targetAudience}}}
  Website URL: {{{websiteUrl}}}

  Generate a comprehensive local SEO strategy as a JSON object.
  The JSON object MUST conform to the defined output schema (AIPromptOutputSchema).
  Each field in the JSON object should contain actionable advice, lists, or summaries as per the schema descriptions.
  For string fields requiring strategic advice, provide concise, specific, and actionable text. This text can use simple markdown (like bolding for emphasis, or bullet points using '*' or '-') if it enhances readability within the string.
  
  **Keyword Research ('keywordResearch'):**
  - For 'primaryKeywords', 'secondaryKeywords', and 'longTailKeywords', each item MUST be an object with:
    - "text": The keyword itself (e.g., "best coding bootcamp {{{location}}}", "{{{institutionType}}} admissions {{{location}}}").
    - "searchVolumeLast24h": An *estimated* search volume (e.g., 'approx. 10-20', 'low', 'medium', 'high', 'unavailable').
    - "searchVolumeLast7d": An *estimated* search volume (e.g., 'approx. 100-150', 'medium-high', 'high', 'unavailable').
  - Primary: 3-5 core local keywords.
  - Secondary: 5-7 related keywords, including program-specific terms.
  - Long-Tail: 3-5 examples of longer, more specific queries.
  - 'toolsMention': Briefly mention using Google Keyword Planner for volume ideas and Google Trends for seasonality.

  **Google My Business Optimization ('gmbOptimization'):**
  - 'profileCompleteness': Stress 100% completion.
  - 'napConsistency': Emphasize consistent Name, Address, Phone (NAP) everywhere.
  - 'categories': Recommend accurate primary and additional GMB categories.
  - 'servicesProducts': Suggest detailing {{{programsOffered}}} as services/products in GMB.
  - 'photosVideos': Advise on regular uploads of high-quality, diverse media (campus, activities, staff).
  - 'gmbPosts': Recommend types of posts (Events, Offers, What's New) and frequency, linking to website pages.
  - 'qaSection': Suggest proactively adding common questions & answers, and monitoring for new ones.
  - 'reviewsStrategy': Outline strategies for ethically encouraging reviews and responding to all reviews (positive & negative) using GMB review management tools.

  **On-Page Local SEO ('onPageLocalSEO'):**
  - 'localizedContent': Recommend creating location-specific pages (e.g., "Admissions in {{{location}}}", specific program pages for {{{location}}}) or content.
  - 'titleTagsMetaDescriptions': Guide on optimizing with local keywords and compelling copy for CTR.
  - 'headerTags': Explain using H1-H6 for structure and local keywords.
  - 'imageOptimization': Advise on local keywords in image alt text, filenames, and geo-tagging where appropriate.
  - 'localBusinessSchema': Strongly recommend implementing LocalBusiness schema markup (JSON-LD preferred). Provide a basic example structure if possible within the string, or refer to Google's documentation.

  **Local Link Building ('localLinkBuilding'):**
  - 'localDirectories': Suggest relevant local and niche directories (e.g., local chamber of commerce, education-specific directories).
  - 'communityPartnerships': Recommend partnerships with local organizations, schools, or businesses for backlinks and mentions.
  - 'guestPosting': Suggest guest posting on local blogs or relevant educational sites.
  - 'sponsorships': Mention local event sponsorships for visibility and link opportunities.

  **Technical Local SEO ('technicalLocalSEO'):**
  - 'mobileFriendliness': Stress importance (mention Google's Mobile-Friendly Test).
  - 'siteSpeed': Advise on optimizing (mention Google PageSpeed Insights).
  - 'citationsNapConsistencyCheck': Reiterate checking NAP consistency across major citation sites (e.g., using tools like Moz Local or BrightLocal, or manual checks).

  **Tracking & Reporting ('trackingReporting'):**
  - 'googleAnalytics': How to track local traffic (e.g., geo-segmented reports) and conversions (e.g., form submissions from local users, calls from GMB).
  - 'googleSearchConsole': How to monitor local search performance (queries, impressions, clicks by location via Performance report filters) and indexation.
  - 'kpis': For the 'kpis' array, each item MUST be an object with "text" describing the KPI (e.g., "Increase in organic traffic from {{{location}}} by X%", "Improvement in local pack rankings for 5 primary keywords", "Increase in GMB direction requests by Y%"). Suggest 3-5 relevant KPIs.

  **Executive Summary & Conclusion:**
  - 'executiveSummary': Briefly summarize the core strategy and expected benefits for {{{institutionName}}}.
  - 'conclusion': Provide a brief concluding statement encouraging action.

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
      return {
        executiveSummary: "Error: Failed to generate executive summary. Please refine input or try again.",
        keywordResearch: { primaryKeywords: [], secondaryKeywords: [], longTailKeywords: [], toolsMention: "N/A (Generation Error)" },
        gmbOptimization: { profileCompleteness: "Error", napConsistency: "Error", categories: "Error", servicesProducts: "Error", photosVideos: "Error", gmbPosts: "Error", qaSection: "Error", reviewsStrategy: "Error" },
        onPageLocalSEO: { localizedContent: "Error", titleTagsMetaDescriptions: "Error", headerTags: "Error", imageOptimization: "Error", localBusinessSchema: "Error" },
        localLinkBuilding: { localDirectories: "Error", communityPartnerships: "Error", guestPosting: "Error", sponsorships: "Error" },
        technicalLocalSEO: { mobileFriendliness: "Error", siteSpeed: "Error", citationsNapConsistencyCheck: "Error" },
        trackingReporting: { googleAnalytics: "Error", googleSearchConsole: "Error", kpis: [] },
        conclusion: "Error: Failed to generate conclusion. Please refine input or try again.",
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
