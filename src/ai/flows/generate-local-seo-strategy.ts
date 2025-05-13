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

const GenerateLocalSEOStrategyInputSchema = z.object({
  institutionName: z.string().describe('The name of the educational institution.'),
  location: z.string().describe('The location of the institution (city, state).'),
  programsOffered: z.string().describe('A description of the programs offered by the institution.'),
  targetAudience: z.string().describe('A description of the target audience for the institution.'),
  websiteUrl: z.string().describe('The URL of the institution\'s website.'),
});

export type GenerateLocalSEOStrategyInput = z.infer<
  typeof GenerateLocalSEOStrategyInputSchema
>;

const KeywordResearchSchema = z.object({
  primaryKeywords: z.array(z.string()).describe("List of 3-5 core local keywords. Advise using Google Keyword Planner."),
  secondaryKeywords: z.array(z.string()).describe("List of 5-7 related keywords, including program-specific terms."),
  longTailKeywords: z.array(z.string()).describe("List of 3-5 examples of long-tail keywords. Advise using Google Trends."),
  toolsMention: z.string().describe("Brief mention of tools like Google Keyword Planner and Google Trends.").optional(),
});

const GMBOptimizationSchema = z.object({
  profileCompleteness: z.string().describe("Stress the importance of a 100% complete GMB profile."),
  napConsistency: z.string().describe("Emphasize consistent Name, Address, Phone number (NAP)."),
  categories: z.string().describe("Recommend accurate primary and secondary GMB categories."),
  servicesProducts: z.string().describe("Suggest detailing programs as services/products in GMB."),
  photosVideos: z.string().describe("Advise on uploading high-quality, regular photos and videos."),
  gmbPosts: z.string().describe("Recommend a strategy for frequent GMB posts (updates, events, offers)."),
  qaSection: z.string().describe("Suggest proactively adding common questions and answers."),
  reviewsStrategy: z.string().describe("Outline strategies for ethically encouraging and responding to reviews."),
});

const OnPageSEOSchema = z.object({
  localizedContent: z.string().describe("Recommend creating location-specific pages or content."),
  titleTagsMetaDescriptions: z.string().describe("Guide on optimizing title tags and meta descriptions with local keywords."),
  headerTags: z.string().describe("Explain how to use H1-H6 headers with local keywords."),
  imageOptimization: z.string().describe("Advise on using local keywords in image alt text and filenames."),
  localBusinessSchema: z.string().describe("Strongly recommend implementing LocalBusiness schema markup, provide example snippet guidance."),
});

const LocalLinkBuildingSchema = z.object({
  localDirectories: z.string().describe("Suggest relevant local and niche directories."),
  communityPartnerships: z.string().describe("Recommend partnerships with local organizations for backlinks."),
  guestPosting: z.string().describe("Suggest guest posting on local blogs or educational sites."),
  sponsorships: z.string().describe("Mention local event sponsorships for link opportunities."),
});

const TechnicalLocalSEOSchema = z.object({
  mobileFriendliness: z.string().describe("Stress importance (mention Google's Mobile-Friendly Test)."),
  siteSpeed: z.string().describe("Advise on optimizing site speed (mention Google PageSpeed Insights)."),
  citationsNapConsistencyCheck: z.string().describe("Reiterate checking and correcting NAP consistency."),
});

const TrackingReportingSchema = z.object({
  googleAnalytics: z.string().describe("How to track local traffic and conversions in Google Analytics."),
  googleSearchConsole: z.string().describe("How to monitor local search performance in Google Search Console."),
  kpis: z.array(z.string()).describe("Suggest KPIs like local pack rankings, GMB engagement, organic traffic from target location."),
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

export async function generateLocalSEOStrategy(
  input: GenerateLocalSEOStrategyInput
): Promise<GenerateLocalSEOStrategyOutput> {
  return generateLocalSEOStrategyFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateLocalSEOStrategyPrompt',
  input: {schema: GenerateLocalSEOStrategyInputSchema},
  output: {schema: GenerateLocalSEOStrategyOutputSchema},
  prompt: `You are an expert local SEO strategist specializing in educational institutions, with deep knowledge of Google's SEO tools and best practices.

  Based on the following information:
  Institution Name: {{{institutionName}}}
  Location: {{{location}}}
  Programs Offered: {{{programmesOffered}}}
  Target Audience: {{{targetAudience}}}
  Website URL: {{{websiteUrl}}}

  Generate a comprehensive local SEO strategy as a JSON object.
  The JSON object MUST conform to the defined output schema.
  Each field in the JSON object should contain actionable advice, lists, or summaries as per the schema descriptions.
  For string fields requiring strategic advice, provide concise text. This text can use simple markdown (like bolding for emphasis) if it enhances readability.
  For array fields (like keywords or KPIs), provide an array of strings.

  Structure your response to populate the following fields according to the output schema:
  - executiveSummary
  - keywordResearch (including primaryKeywords, secondaryKeywords, longTailKeywords, toolsMention)
  - gmbOptimization (covering profileCompleteness, napConsistency, categories, servicesProducts, photosVideos, gmbPosts, qaSection, reviewsStrategy)
  - onPageLocalSEO (covering localizedContent, titleTagsMetaDescriptions, headerTags, imageOptimization, localBusinessSchema)
  - localLinkBuilding (covering localDirectories, communityPartnerships, guestPosting, sponsorships)
  - technicalLocalSEO (covering mobileFriendliness, siteSpeed, citationsNapConsistencyCheck)
  - trackingReporting (covering googleAnalytics, googleSearchConsole, kpis)
  - conclusion

  Ensure the entire output is a single, valid JSON object matching the schema.
  `,
});

const generateLocalSEOStrategyFlow = ai.defineFlow(
  {
    name: 'generateLocalSEOStrategyFlow',
    inputSchema: GenerateLocalSEOStrategyInputSchema,
    outputSchema: GenerateLocalSEOStrategyOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output) {
      // Fallback or error handling if AI fails to generate the structured JSON
      // This default error object should ideally match the schema structure for consistency
      // For brevity, we're throwing a direct error here.
      // In a real scenario, you might return a default error structure matching GenerateLocalSEOStrategyOutputSchema
      console.error("AI failed to generate valid structured output for Local SEO Strategy.");
      throw new Error("Failed to generate local SEO strategy. The AI model did not return the expected data structure.");
    }
    return output;
  }
);