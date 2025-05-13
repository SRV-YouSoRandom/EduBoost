// src/ai/schemas/gmb-optimizer-schemas.ts
import { z } from 'genkit';
import type { Status } from '@/types/common';

// Re-exporting schemas from the generation flow for use in refinement and potentially other places
// To avoid circular dependencies or overly complex imports, it's often better to define shared schemas here.
// For now, we'll import and re-export as the structure is simple.

// Input schema for generating GMB optimizations (also used as institutionContext for refinement)
export const GenerateGMBOptimizationsInputSchema = z.object({
  institutionName: z.string().describe('The name of the educational institution.'),
  institutionType: z.string().describe('The type of educational institution (e.g., university, high school, elementary school).'),
  location: z.string().describe('The location of the institution (city, state).'),
  programsOffered: z.string().describe('A description of the programs and courses offered.'),
  targetAudience: z.string().describe('The target audience of the institution (e.g., prospective students, parents).'),
  uniqueSellingPoints: z.string().describe('The unique selling points or advantages of the institution.'),
});
export type GenerateGMBOptimizationsInput = z.infer<typeof GenerateGMBOptimizationsInputSchema>;

// Schema for individual keyword suggestions (used in the output)
export const GMBKeywordSuggestionSchema = z.object({
  id: z.string().describe('Unique identifier for the keyword suggestion.'),
  text: z.string().describe('The keyword suggestion text.'),
  status: z.enum(['pending', 'inProgress', 'done', 'rejected']).default('pending' as Status).describe('The status of the keyword suggestion.'),
  searchVolumeLast24h: z.string().optional().describe('Estimated search volume in the last 24 hours for the given location. (e.g., "approx 50 searches", "low", "data unavailable")'),
  searchVolumeLast7d: z.string().optional().describe('Estimated search volume in the last 7 days for the given location. (e.g., "approx 350 searches", "medium", "data unavailable")'),
});
export type GMBKeywordSuggestion = z.infer<typeof GMBKeywordSuggestionSchema>;

// Output schema for generating GMB optimizations (also the type for currentStrategy in refinement)
export const GenerateGMBOptimizationsOutputSchema = z.object({
  keywordSuggestions: z.array(GMBKeywordSuggestionSchema).describe('A list of keyword suggestions for the GMB profile, each with status and estimated search volume.'),
  keywordSuggestionsSectionStatus: z.enum(['pending', 'inProgress', 'done', 'rejected']).default('pending' as Status).describe('Overall status for the keyword suggestions section.'),
  descriptionSuggestions: z.string().describe('Suggested GMB business description in markdown format, highlighting unique selling points and programs.'),
  descriptionSuggestionsStatus: z.enum(['pending', 'inProgress', 'done', 'rejected']).default('pending' as Status).describe('Status for description suggestions.'),
  optimizationTips: z.string().describe('Additional GMB optimization tips in markdown format, covering posts, Q&A, photos, services, and reviews, referencing Google My Business features.'),
  optimizationTipsStatus: z.enum(['pending', 'inProgress', 'done', 'rejected']).default('pending' as Status).describe('Status for optimization tips.'),
});
export type GenerateGMBOptimizationsOutput = z.infer<typeof GenerateGMBOptimizationsOutputSchema>;


// AI output schema for keywords (used internally by the generation prompt)
export const AIKeywordSuggestionSchema = z.object({
  text: z.string().describe('The keyword suggestion text.'),
  searchVolumeLast24h: z.string().optional().describe('Estimated search volume in the last 24 hours for the given location. (e.g., "approx 50 searches", "low", "data unavailable")'),
  searchVolumeLast7d: z.string().optional().describe('Estimated search volume in the last 7 days for the given location. (e.g., "approx 350 searches", "medium", "data unavailable")'),
});
export type AIKeywordSuggestion = z.infer<typeof AIKeywordSuggestionSchema>;

// Output schema for the AI prompt (used internally by the generation flow)
export const GMBAIPromptOutputSchema = z.object({
  keywordSuggestions: z.array(AIKeywordSuggestionSchema).describe('An array of keyword suggestion objects for the GMB profile, including estimated search volumes.'),
  descriptionSuggestions: z.string().describe('Suggested GMB business description in markdown format, highlighting unique selling points and programs.'),
  optimizationTips: z.string().describe('Additional GMB optimization tips in markdown format, covering posts, Q&A, photos, services, and reviews, referencing Google My Business features.')
});
export type GMBAIPromptOutput = z.infer<typeof GMBAIPromptOutputSchema>;


// Schema for refineGMBOptimizations flow input
export const RefineGMBOptimizationsInputSchema = z.object({
  currentStrategy: GenerateGMBOptimizationsOutputSchema.describe("The existing GMB optimization strategy object."),
  userPrompt: z.string().describe("The user's prompt detailing the desired modifications or additions to the GMB strategy."),
  institutionContext: GenerateGMBOptimizationsInputSchema.describe("The original context of the educational institution."),
});
export type RefineGMBOptimizationsInput = z.infer<typeof RefineGMBOptimizationsInputSchema>;

// The output of the refinement flow will be GenerateGMBOptimizationsOutputSchema
