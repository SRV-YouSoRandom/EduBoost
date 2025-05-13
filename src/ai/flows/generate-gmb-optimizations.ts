
// Use server directive is required for Genkit flows.
'use server';
/**
 * @fileOverview GMB Optimization AI agent using Google My Business best practices.
 *
 * - generateGMBOptimizations - A function that handles the GMB optimization process.
 * - GenerateGMBOptimizationsInput - The input type for the generateGMBOptimizations function.
 * - GenerateGMBOptimizationsOutput - The return type for the generateGMBOptimizations function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { Status } from '@/types/common';

const GenerateGMBOptimizationsInputSchema = z.object({
  institutionName: z.string().describe('The name of the educational institution.'),
  institutionType: z.string().describe('The type of educational institution (e.g., university, high school, elementary school).'),
  location: z.string().describe('The location of the institution (city, state).'),
  programsOffered: z.string().describe('A description of the programs and courses offered.'),
  targetAudience: z.string().describe('The target audience of the institution (e.g., prospective students, parents).'),
  uniqueSellingPoints: z.string().describe('The unique selling points or advantages of the institution.'),
});
export type GenerateGMBOptimizationsInput = z.infer<typeof GenerateGMBOptimizationsInputSchema>;

const GMBKeywordSuggestionSchema = z.object({
  id: z.string().describe('Unique identifier for the keyword suggestion.'),
  text: z.string().describe('The keyword suggestion text.'),
  status: z.enum(['pending', 'inProgress', 'done', 'rejected']).default('pending' as Status).describe('The status of the keyword suggestion.'),
  searchVolumeLast24h: z.string().optional().describe('Estimated search volume in the last 24 hours for the given location. (e.g., "approx 50 searches", "low", "data unavailable")'),
  searchVolumeLast7d: z.string().optional().describe('Estimated search volume in the last 7 days for the given location. (e.g., "approx 350 searches", "medium", "data unavailable")'),
});
export type GMBKeywordSuggestion = z.infer<typeof GMBKeywordSuggestionSchema>;

const GenerateGMBOptimizationsOutputSchema = z.object({
  keywordSuggestions: z.array(GMBKeywordSuggestionSchema).describe('A list of keyword suggestions for the GMB profile, each with status and estimated search volume.'),
  // keywordSuggestionsStatus is now implicitly handled by each item's status, or could be an overall status for the generation process itself.
  // Keeping it as an overall status for the section for now.
  keywordSuggestionsSectionStatus: z.enum(['pending', 'inProgress', 'done', 'rejected']).default('pending' as Status).describe('Overall status for the keyword suggestions section.'),
  descriptionSuggestions: z.string().describe('Suggested GMB business description in markdown format, highlighting unique selling points and programs.'),
  descriptionSuggestionsStatus: z.enum(['pending', 'inProgress', 'done', 'rejected']).default('pending' as Status).describe('Status for description suggestions.'),
  optimizationTips: z.string().describe('Additional GMB optimization tips in markdown format, covering posts, Q&A, photos, services, and reviews, referencing Google My Business features.'),
  optimizationTipsStatus: z.enum(['pending', 'inProgress', 'done', 'rejected']).default('pending' as Status).describe('Status for optimization tips.'),
});
export type GenerateGMBOptimizationsOutput = z.infer<typeof GenerateGMBOptimizationsOutputSchema>;

export async function generateGMBOptimizations(input: GenerateGMBOptimizationsInput): Promise<GenerateGMBOptimizationsOutput> {
  return generateGMBOptimizationsFlow(input);
}

// AI output schema for keywords
const AIKeywordSuggestionSchema = z.object({
  text: z.string().describe('The keyword suggestion text.'),
  searchVolumeLast24h: z.string().optional().describe('Estimated search volume in the last 24 hours for the given location. (e.g., "approx 50 searches", "low", "data unavailable")'),
  searchVolumeLast7d: z.string().optional().describe('Estimated search volume in the last 7 days for the given location. (e.g., "approx 350 searches", "medium", "data unavailable")'),
});

const PromptOutputSchema = z.object({
  keywordSuggestions: z.array(AIKeywordSuggestionSchema).describe('An array of keyword suggestion objects for the GMB profile, including estimated search volumes.'),
  descriptionSuggestions: z.string().describe('Suggested GMB business description in markdown format, highlighting unique selling points and programs.'),
  optimizationTips: z.string().describe('Additional GMB optimization tips in markdown format, covering posts, Q&A, photos, services, and reviews, referencing Google My Business features.')
});


const prompt = ai.definePrompt({
  name: 'generateGMBOptimizationsPrompt',
  input: {schema: GenerateGMBOptimizationsInputSchema},
  output: {schema: PromptOutputSchema},
  prompt: `You are an expert in Google My Business (GMB) optimization for educational institutions, leveraging all features of the GMB platform.

  Based on the information provided:
  Institution Name: {{{institutionName}}}
  Institution Type: {{{institutionType}}}
  Location: {{{location}}}
  Programs Offered: {{{programsOffered}}}
  Target Audience: {{{targetAudience}}}
  Unique Selling Points: {{{uniqueSellingPoints}}}

  Provide your output as a JSON object adhering to the defined schema.

  For 'keywordSuggestions', provide an array of objects. Each object must include:
  - "text": The keyword suggestion (e.g., "Preschool {{{location}}}", "{{{institutionType}}} near me", "Best STEM programs {{{location}}}").
  - "searchVolumeLast24h": An estimated search volume for this keyword in '{{{location}}}' over the last 24 hours. State if data is unavailable or an approximation (e.g., 'approx. 5-10', 'low', 'unavailable').
  - "searchVolumeLast7d": An estimated search volume for this keyword in '{{{location}}}' over the last 7 days. State if data is unavailable or an approximation (e.g., 'approx. 50-70', 'medium', 'unavailable').
  Include a mix of general and specific local keywords.

  For 'descriptionSuggestions', craft an engaging GMB business description (max 750 characters). Use markdown for light formatting (bolding key phrases). Highlight unique selling points and programs.
  Example for descriptionSuggestions:
  "**{{{institutionName}}}** in {{{location}}} offers exceptional [Program Type] programs for {{{targetAudience}}}. We focus on [Unique Selling Point 1] and [Unique Selling Point 2]. Our curriculum includes: {{{programsOffered}}}. Visit us to discover a nurturing learning environment!"

  For 'optimizationTips', provide a markdown list of actionable tips covering these GMB features:
  - **GMB Posts:** Suggest types of posts (events, offers, news) and frequency.
  - **Q&A Feature:** Advise on populating common questions and promptly answering new ones.
  - **Photos & Videos:** Recommend types of visuals (campus, classrooms, activities, staff) and regular uploads.
  - **Services/Products:** How to list {{{programsOffered}}} effectively.
  - **Reviews Management:** Strategy for encouraging and responding to reviews.
  - **Attributes:** Suggest relevant GMB attributes to select (e.g., accessibility, amenities).
  - **Messaging:** Importance of enabling and responding to GMB messages.
  Example for optimizationTips:
  \`\`\`markdown
  - **GMB Posts:** Share weekly updates about student achievements or upcoming open house events. Use compelling images.
  - **Q&A:** Add 5-10 common questions parents ask about admissions, curriculum, and facilities.
  - **Photos:** Upload at least 10 high-quality photos showcasing your campus, classrooms, and student activities this month. Add a virtual tour if possible.
  - **Services:** List each main program offered (e.g., "Preschool Program", "Kindergarten Program") with detailed descriptions and even pricing if applicable.
  - **Reviews:** Actively request reviews from happy parents and respond to all reviews (positive and negative) within 24-48 hours.
  \`\`\`
  Ensure all outputs adhere to the formatting requested in their descriptions.
  The entire output must be a single, valid JSON object.
  `,
});

const generateGMBOptimizationsFlow = ai.defineFlow(
  {
    name: 'generateGMBOptimizationsFlow',
    inputSchema: GenerateGMBOptimizationsInputSchema,
    outputSchema: GenerateGMBOptimizationsOutputSchema,
  },
  async (input): Promise<GenerateGMBOptimizationsOutput> => {
    const {output} = await prompt(input);
     if (output && output.keywordSuggestions && output.descriptionSuggestions && output.optimizationTips) {
      const mappedKeywordSuggestions: GMBKeywordSuggestion[] = output.keywordSuggestions.map(kw => ({
        id: crypto.randomUUID(),
        text: kw.text,
        status: 'pending' as Status,
        searchVolumeLast24h: kw.searchVolumeLast24h,
        searchVolumeLast7d: kw.searchVolumeLast7d,
      }));
      
      return { 
        keywordSuggestions: mappedKeywordSuggestions,
        keywordSuggestionsSectionStatus: 'pending',
        descriptionSuggestions: output.descriptionSuggestions,
        descriptionSuggestionsStatus: 'pending',
        optimizationTips: output.optimizationTips,
        optimizationTipsStatus: 'pending',
      };
    }
    // Fallback error structure matching the output schema
    return { 
      keywordSuggestions: [],
      keywordSuggestionsSectionStatus: 'pending',
      descriptionSuggestions: "Error: Could not generate description suggestions.",
      descriptionSuggestionsStatus: 'pending',
      optimizationTips: "- Error: Could not generate optimization tips.",
      optimizationTipsStatus: 'pending',
    };
  }
);

// Ensure this file only exports the async function and types if it's being treated as a server action module.
// Schemas are defined above but not exported if GenerateGMBOptimizationsInputSchema is causing issues.
// For now, assuming the current export structure is fine based on prior fixes focusing on top-level exports.
// If error persists for this file, GenerateGMBOptimizationsInputSchema might need to be moved.

