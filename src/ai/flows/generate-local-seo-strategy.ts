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
import {z} from 'genkit';
import type { Status, ItemWithIdAndStatus } from '@/types/common'; // ItemWithIdAndStatus will be used

export const GenerateLocalSEOStrategyInputSchema = z.object({
  institutionName: z.string().describe('The name of the educational institution.'),
  location: z.string().describe('The location of the institution (city, state).'),
  programsOffered: z.string().describe('A description of the programs offered by the institution.'),
  targetAudience: z.string().describe('A description of the target audience for the institution.'),
  websiteUrl: z.string().describe('The URL of the institution\'s website.'),
});

export type GenerateLocalSEOStrategyInput = z.infer<
  typeof GenerateLocalSEOStrategyInputSchema
>;

// Re-using ItemWithIdAndStatus from common types by extending it in the output if needed,
// or ensuring the AI prompt output schema aligns for easy mapping.
// Here, ItemWithStatusSchema is defined locally but aligns with ItemWithIdAndStatus + search volumes.
export const KeywordItemWithStatusSchema = z.object({
  id: z.string().describe('Unique identifier for the item.'),
  text: z.string().describe('The text content of the item.'),
  status: z.enum(['pending', 'inProgress', 'done', 'rejected']).default('pending' as Status).describe('The status of the item.'),
  searchVolumeLast24h: z.string().optional().describe('Estimated search volume in the last 24 hours for the given location. (e.g., "approx 50 searches", "low", "data unavailable")'),
  searchVolumeLast7d: z.string().optional().describe('Estimated search volume in the last 7 days for the given location. (e.g., "approx 350 searches", "medium", "data unavailable")'),
});
export type KeywordItemWithStatus = z.infer<typeof KeywordItemWithStatusSchema>;


const KeywordResearchSchema = z.object({
  primaryKeywords: z.array(KeywordItemWithStatusSchema).describe("List of 3-5 core local keywords with status and estimated search volumes. Advise using Google Keyword Planner."),
  secondaryKeywords: z.array(KeywordItemWithStatusSchema).describe("List of 5-7 related keywords with status and estimated search volumes, including program-specific terms."),
  longTailKeywords: z.array(KeywordItemWithStatusSchema).describe("List of 3-5 examples of long-tail keywords with status and estimated search volumes. Advise using Google Trends."),
  toolsMention: z.string().describe("Brief mention of tools like Google Keyword Planner and Google Trends.").optional(),
});

export const GMBOptimizationSchema = z.object({
  profileCompleteness: z.string().describe("Stress the importance of a 100% complete GMB profile."),
  napConsistency: z.string().describe("Emphasize consistent Name, Address, Phone number (NAP)."),
  categories: z.string().describe("Recommend accurate primary and secondary GMB categories."),
  servicesProducts: z.string().describe("Suggest detailing programs as services/products in GMB."),
  photosVideos: z.string().describe("Advise on uploading high-quality, regular photos and videos."),
  gmbPosts: z.string().describe("Recommend a strategy for frequent GMB posts (updates, events, offers)."),
  qaSection: z.string().describe("Suggest proactively adding common questions and answers."),
  reviewsStrategy: z.string().describe("Outline strategies for ethically encouraging and responding to reviews."),
});

export const OnPageSEOSchema = z.object({
  localizedContent: z.string().describe("Recommend creating location-specific pages or content."),
  titleTagsMetaDescriptions: z.string().describe("Guide on optimizing title tags and meta descriptions with local keywords."),
  headerTags: z.string().describe("Explain how to use H1-H6 headers with local keywords."),
  imageOptimization: z.string().describe("Advise on using local keywords in image alt text and filenames."),
  localBusinessSchema: z.string().describe("Strongly recommend implementing LocalBusiness schema markup, provide example snippet guidance."),
});

export const LocalLinkBuildingSchema = z.object({
  localDirectories: z.string().describe("Suggest relevant local and niche directories."),
  communityPartnerships: z.string().describe("Recommend partnerships with local organizations for backlinks."),
  guestPosting: z.string().describe("Suggest guest posting on local blogs or educational sites."),
  sponsorships: z.string().describe("Mention local event sponsorships for link opportunities."),
});

export const TechnicalLocalSEOSchema = z.object({
  mobileFriendliness: z.string().describe("Stress importance (mention Google's Mobile-Friendly Test)."),
  siteSpeed: z.string().describe("Advise on optimizing site speed (mention Google PageSpeed Insights)."),
  citationsNapConsistencyCheck: z.string().describe("Reiterate checking and correcting NAP consistency."),
});

const TrackingReportingSchema = z.object({
  googleAnalytics: z.string().describe("How to track local traffic and conversions in Google Analytics."),
  googleSearchConsole: z.string().describe("How to monitor local search performance in Google Search Console."),
  kpis: z.array(KeywordItemWithStatusSchema).describe("Suggest KPIs like local pack rankings, GMB engagement, organic traffic from target location, each with status."), // Reusing KeywordItemWithStatusSchema for similar structure for KPIs.
});

export const GenerateLocalSEOStrategyOutputSchema = z.object({
  executiveSummary: z.string().describe("Briefly summarize the proposed local SEO strategy."),
  keywordResearch: KeywordResearchSchema,
  gmbOptimization: GMBOptimizationSchema,
  onPageLocalSEO: OnPageSEOSchema,
  localLinkBuilding: LocalLinkBuildingSchema,
  technicalLocalSEO: TechnicalLocalSEOSchema,
  trackingReporting: TrackingReportingSchema,
  conclusion: z.string().describe("Provide a brief concluding statement."),
});
export type GenerateLocalSEOStrategyOutput = z.infer<
  typeof GenerateLocalSEOStrategyOutputSchema
>;


// Schema for what the AI prompt is expected to return
const AIKeywordSchema = z.object({
  text: z.string().describe('The keyword text.'),
  searchVolumeLast24h: z.string().optional().describe('Estimated search volume in the last 24 hours for the given location. (e.g., "approx 50 searches", "low", "data unavailable")'),
  searchVolumeLast7d: z.string().optional().describe('Estimated search volume in the last 7 days for the given location. (e.g., "approx 350 searches", "medium", "data unavailable")'),
});

export const AIKeywordResearchSchema = z.object({ // Exported for reuse in refinement flow
  primaryKeywords: z.array(AIKeywordSchema).describe("List of 3-5 core local keywords with estimated search volumes."),
  secondaryKeywords: z.array(AIKeywordSchema).describe("List of 5-7 related keywords with estimated search volumes."),
  longTailKeywords: z.array(AIKeywordSchema).describe("List of 3-5 examples of long-tail keywords with estimated search volumes."),
  toolsMention: z.string().describe("Brief mention of tools like Google Keyword Planner and Google Trends.").optional(),
});

const AIKpiSchema = z.object({ // KPIs also have text, but not search volume.
  text: z.string().describe('The KPI description.')
});

export const AITrackingReportingSchema = z.object({ // Exported for reuse in refinement flow
  googleAnalytics: z.string(),
  googleSearchConsole: z.string(),
  kpis: z.array(AIKpiSchema).describe("Suggest KPIs..."),
});

const AIPromptOutputSchema = z.object({
  executiveSummary: z.string(),
  keywordResearch: AIKeywordResearchSchema,
  gmbOptimization: GMBOptimizationSchema,
  onPageLocalSEO: OnPageSEOSchema,
  localLinkBuilding: LocalLinkBuildingSchema,
  technicalLocalSEO: TechnicalLocalSEOSchema,
  trackingReporting: AITrackingReportingSchema,
  conclusion: z.string(),
});


export async function generateLocalSEOStrategy(
  input: GenerateLocalSEOStrategyInput
): Promise<GenerateLocalSEOStrategyOutput> {
  return generateLocalSEOStrategyFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateLocalSEOStrategyPrompt',
  input: {schema: GenerateLocalSEOStrategyInputSchema},
  output: {schema: AIPromptOutputSchema},
  prompt: `You are an expert local SEO strategist specializing in educational institutions, with deep knowledge of Google's SEO tools and best practices.

  Based on the following information:
  Institution Name: {{{institutionName}}}
  Location: {{{location}}}
  Programs Offered: {{{programsOffered}}}
  Target Audience: {{{targetAudience}}}
  Website URL: {{{websiteUrl}}}

  Generate a comprehensive local SEO strategy as a JSON object.
  The JSON object MUST conform to the defined output schema (AI version).
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

export const mapAiKeywordsToItemsWithStatus = (aiKeywords: z.infer<typeof AIKeywordSchema>[]): KeywordItemWithStatus[] => {
  return aiKeywords.map(keyword => ({
    id: crypto.randomUUID(),
    text: keyword.text,
    status: 'pending' as Status,
    searchVolumeLast24h: keyword.searchVolumeLast24h,
    searchVolumeLast7d: keyword.searchVolumeLast7d,
  }));
};

export const mapAiKpisToItemsWithStatus = (aiKpis: z.infer<typeof AIKpiSchema>[]): KeywordItemWithStatus[] => {
  return aiKpis.map(kpi => ({
    id: crypto.randomUUID(),
    text: kpi.text,
    status: 'pending' as Status,
    // searchVolume fields are not applicable for KPIs, will be undefined
  }));
};

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