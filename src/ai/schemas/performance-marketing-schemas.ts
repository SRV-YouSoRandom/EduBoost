// src/ai/schemas/performance-marketing-schemas.ts
import { z } from 'genkit';
import type { Status } from '@/types/common';

// Input schema for generating Performance Marketing Strategy (also used as institutionContext for refinement)
export const GeneratePerformanceMarketingStrategyInputSchema = z.object({
  institutionName: z.string().describe('The name of the educational institution.'),
  institutionType: z
    .string()
    .describe(
      'The type of educational institution (e.g., university, college, vocational school).'
    ),
  targetAudience: z
    .string()
    .describe(
      'The target audience for the marketing strategy (e.g., prospective students, parents). Detail demographics, interests, and online behavior if known.'
    ),
  programsOffered: z
    .string()
    .describe('A description of the key programs offered by the institution relevant for marketing.'),
  location: z.string().describe('The geographical location/target market of the educational institution (e.g., city, region, national, international).'),
  marketingBudget: z
    .string()
    .describe('The approximate marketing budget (e.g., "$500/month", "Flexible up to $10k/quarter").'),
  marketingGoals: z.string().describe('The primary goals of the marketing campaign (e.g., "Increase enrollment by 10%", "Generate 50 leads for X program", "Improve brand awareness in Y region").'),
});
export type GeneratePerformanceMarketingStrategyInput = z.infer<
  typeof GeneratePerformanceMarketingStrategyInputSchema
>;

// Output schema for generating Performance Marketing Strategy (also for refinement output)
export const GeneratePerformanceMarketingStrategyOutputSchema = z.object({
  marketingStrategyDocument: z
    .string()
    .describe(
      'A detailed performance marketing strategy as a well-formatted markdown document. This document should outline recommended platforms (especially Google Ads), budget allocation, KPIs, and content suggestions.'
    ),
  documentStatus: z.enum(['pending', 'inProgress', 'done', 'rejected']).default('pending' as Status).describe('The status of the entire marketing strategy document.'),
});
export type GeneratePerformanceMarketingStrategyOutput = z.infer<
  typeof GeneratePerformanceMarketingStrategyOutputSchema
>;

// Schema for the AI prompt output in generatePerformanceMarketingStrategy flow
export const PerformanceMarketingAIPromptOutputSchema = z.object({
  marketingStrategyDocument: z.string().describe('Markdown document content')
});
export type PerformanceMarketingAIPromptOutput = z.infer<typeof PerformanceMarketingAIPromptOutputSchema>;


// Schema for refinePerformanceMarketingStrategy flow input
export const RefinePerformanceMarketingStrategyInputSchema = z.object({
  currentStrategy: GeneratePerformanceMarketingStrategyOutputSchema.describe("The existing performance marketing strategy object (document and status)."),
  userPrompt: z.string().describe("The user's prompt detailing the desired modifications to the marketing strategy document."),
  institutionContext: GeneratePerformanceMarketingStrategyInputSchema.describe("The original context of the educational institution and marketing goals."),
});
export type RefinePerformanceMarketingStrategyInput = z.infer<typeof RefinePerformanceMarketingStrategyInputSchema>;

// The output of the refinement flow will be GeneratePerformanceMarketingStrategyOutputSchema
