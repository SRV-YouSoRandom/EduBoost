// src/ai/schemas/local-seo-schemas.ts
import { z } from 'genkit';
import type { Status } from '@/types/common';

// Schemas for AI interaction (intermediate structures for prompts)
export const AIKeywordSchema = z.object({
  text: z.string().describe('The keyword text.'),
  searchVolumeLast24h: z.string().optional().describe('Estimated search volume in the last 24 hours for the given location. (e.g., "approx 50 searches", "low", "data unavailable")'),
  searchVolumeLast7d: z.string().optional().describe('Estimated search volume in the last 7 days for the given location. (e.g., "approx 350 searches", "medium", "data unavailable")'),
});
export type AIKeyword = z.infer<typeof AIKeywordSchema>;

export const AIKpiSchema = z.object({
  text: z.string().describe('The KPI description.')
});
export type AIKpi = z.infer<typeof AIKpiSchema>;

export const AIKeywordResearchSchema = z.object({
  primaryKeywords: z.array(AIKeywordSchema).describe("List of 3-5 core local keywords with estimated search volumes."),
  secondaryKeywords: z.array(AIKeywordSchema).describe("List of 5-7 related keywords with estimated search volumes."),
  longTailKeywords: z.array(AIKeywordSchema).describe("List of 3-5 examples of long-tail keywords with estimated search volumes."),
  toolsMention: z.string().describe("Brief mention of tools like Google Keyword Planner and Google Trends.").optional(),
});
export type AIKeywordResearch = z.infer<typeof AIKeywordResearchSchema>;

export const AITrackingReportingSchema = z.object({
  googleAnalytics: z.string(),
  googleSearchConsole: z.string(),
  kpis: z.array(AIKpiSchema).describe("Suggest KPIs..."),
});
export type AITrackingReporting = z.infer<typeof AITrackingReportingSchema>;

// Schemas for individual sections of the Local SEO Strategy (reused in output and AI prompt output)
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
export type GMBOptimization = z.infer<typeof GMBOptimizationSchema>;

export const OnPageSEOSchema = z.object({
  localizedContent: z.string().describe("Recommend creating location-specific pages or content."),
  titleTagsMetaDescriptions: z.string().describe("Guide on optimizing title tags and meta descriptions with local keywords."),
  headerTags: z.string().describe("Explain how to use H1-H6 headers with local keywords."),
  imageOptimization: z.string().describe("Advise on using local keywords in image alt text and filenames."),
  localBusinessSchema: z.string().describe("Strongly recommend implementing LocalBusiness schema markup, provide example snippet guidance."),
});
export type OnPageSEO = z.infer<typeof OnPageSEOSchema>;

export const LocalLinkBuildingSchema = z.object({
  localDirectories: z.string().describe("Suggest relevant local and niche directories."),
  communityPartnerships: z.string().describe("Recommend partnerships with local organizations for backlinks."),
  guestPosting: z.string().describe("Suggest guest posting on local blogs or educational sites."),
  sponsorships: z.string().describe("Mention local event sponsorships for link opportunities."),
});
export type LocalLinkBuilding = z.infer<typeof LocalLinkBuildingSchema>;

export const TechnicalLocalSEOSchema = z.object({
  mobileFriendliness: z.string().describe("Stress importance (mention Google's Mobile-Friendly Test)."),
  siteSpeed: z.string().describe("Advise on optimizing site speed (mention Google PageSpeed Insights)."),
  citationsNapConsistencyCheck: z.string().describe("Reiterate checking and correcting NAP consistency."),
});
export type TechnicalLocalSEO = z.infer<typeof TechnicalLocalSEOSchema>;

// Schema for items that include status (keywords, KPIs)
export const KeywordItemWithStatusSchema = z.object({
  id: z.string().describe('Unique identifier for the item.'),
  text: z.string().describe('The text content of the item.'),
  status: z.enum(['pending', 'inProgress', 'done', 'rejected']).default('pending' as Status).describe('The status of the item.'),
  searchVolumeLast24h: z.string().optional().describe('Estimated search volume in the last 24 hours for the given location. (e.g., "approx 50 searches", "low", "data unavailable")'),
  searchVolumeLast7d: z.string().optional().describe('Estimated search volume in the last 7 days for the given location. (e.g., "approx 350 searches", "medium", "data unavailable")'),
});
export type KeywordItemWithStatus = z.infer<typeof KeywordItemWithStatusSchema>;

// Schemas for the main flow input and output
export const GenerateLocalSEOStrategyInputSchema = z.object({
  institutionName: z.string().describe('The name of the educational institution.'),
  location: z.string().describe('The location of the institution (city, state).'),
  programsOffered: z.string().describe('A description of the programs offered by the institution.'),
  targetAudience: z.string().describe('A description of the target audience for the institution.'),
  websiteUrl: z.string().describe('The URL of the institution\'s website.'),
});
export type GenerateLocalSEOStrategyInput = z.infer<typeof GenerateLocalSEOStrategyInputSchema>;

const KeywordResearchOutputSchema = z.object({ // This is the 'keywordResearch' part of the final output
  primaryKeywords: z.array(KeywordItemWithStatusSchema).describe("List of 3-5 core local keywords with status and estimated search volumes. Advise using Google Keyword Planner."),
  secondaryKeywords: z.array(KeywordItemWithStatusSchema).describe("List of 5-7 related keywords with status and estimated search volumes, including program-specific terms."),
  longTailKeywords: z.array(KeywordItemWithStatusSchema).describe("List of 3-5 examples of long-tail keywords with status and estimated search volumes. Advise using Google Trends."),
  toolsMention: z.string().describe("Brief mention of tools like Google Keyword Planner and Google Trends.").optional(),
});

const TrackingReportingOutputSchema = z.object({ // This is the 'trackingReporting' part of the final output
  googleAnalytics: z.string().describe("How to track local traffic and conversions in Google Analytics."),
  googleSearchConsole: z.string().describe("How to monitor local search performance in Google Search Console."),
  kpis: z.array(KeywordItemWithStatusSchema).describe("Suggest KPIs like local pack rankings, GMB engagement, organic traffic from target location, each with status."),
});

export const GenerateLocalSEOStrategyOutputSchema = z.object({
  executiveSummary: z.string().describe("Briefly summarize the proposed local SEO strategy."),
  keywordResearch: KeywordResearchOutputSchema,
  gmbOptimization: GMBOptimizationSchema,
  onPageLocalSEO: OnPageSEOSchema,
  localLinkBuilding: LocalLinkBuildingSchema,
  technicalLocalSEO: TechnicalLocalSEOSchema,
  trackingReporting: TrackingReportingOutputSchema,
  conclusion: z.string().describe("Provide a brief concluding statement."),
});
export type GenerateLocalSEOStrategyOutput = z.infer<typeof GenerateLocalSEOStrategyOutputSchema>;

// Schema for the AI Prompt output (used by both generation and refinement prompts)
export const AIPromptOutputSchema = z.object({
  executiveSummary: z.string(),
  keywordResearch: AIKeywordResearchSchema,
  gmbOptimization: GMBOptimizationSchema,
  onPageLocalSEO: OnPageSEOSchema,
  localLinkBuilding: LocalLinkBuildingSchema,
  technicalLocalSEO: TechnicalLocalSEOSchema,
  trackingReporting: AITrackingReportingSchema,
  conclusion: z.string(),
});
export type AIPromptOutput = z.infer<typeof AIPromptOutputSchema>;

// Schemas for refineLocalSEOStrategy flow
export const RefineLocalSEOStrategyInputSchema = z.object({
  currentStrategy: GenerateLocalSEOStrategyOutputSchema.describe("The existing Local SEO strategy JSON object."),
  userPrompt: z.string().describe("The user's prompt detailing the desired modifications or additions to the strategy."),
  institutionContext: GenerateLocalSEOStrategyInputSchema.describe("The original context of the educational institution."),
});
export type RefineLocalSEOStrategyInput = z.infer<typeof RefineLocalSEOStrategyInputSchema>;
