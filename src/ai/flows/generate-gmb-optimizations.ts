
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
import type { Status } from '@/types/common';
import {
  GenerateGMBOptimizationsInputSchema,
  GenerateGMBOptimizationsOutputSchema,
  GMBKeywordSuggestionSchema, // Re-export GMBKeywordSuggestion type as well if needed
  GMBAIPromptOutputSchema,
  AIKeywordSuggestionSchema, // If this is needed by other files, export from schema file too.
} from '@/ai/schemas/gmb-optimizer-schemas';

export type { 
  GenerateGMBOptimizationsInput, 
  GenerateGMBOptimizationsOutput,
  GMBKeywordSuggestion 
} from '@/ai/schemas/gmb-optimizer-schemas';


export async function generateGMBOptimizations(input: import('@/ai/schemas/gmb-optimizer-schemas').GenerateGMBOptimizationsInput): Promise<import('@/ai/schemas/gmb-optimizer-schemas').GenerateGMBOptimizationsOutput> {
  return generateGMBOptimizationsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateGMBOptimizationsPrompt',
  input: {schema: GenerateGMBOptimizationsInputSchema},
  output: {schema: GMBAIPromptOutputSchema}, // AI returns this structure
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
  async (input): Promise<import('@/ai/schemas/gmb-optimizer-schemas').GenerateGMBOptimizationsOutput> => {
    const {output: aiOutput} = await prompt(input);
     if (aiOutput && aiOutput.keywordSuggestions && aiOutput.descriptionSuggestions && aiOutput.optimizationTips) {
      const mappedKeywordSuggestions: import('@/ai/schemas/gmb-optimizer-schemas').GMBKeywordSuggestion[] = aiOutput.keywordSuggestions.map(kw => ({
        id: crypto.randomUUID(),
        text: kw.text,
        status: 'pending' as Status,
        searchVolumeLast24h: kw.searchVolumeLast24h,
        searchVolumeLast7d: kw.searchVolumeLast7d,
      }));
      
      return { 
        keywordSuggestions: mappedKeywordSuggestions,
        keywordSuggestionsSectionStatus: 'pending', // Default status for the section
        descriptionSuggestions: aiOutput.descriptionSuggestions,
        descriptionSuggestionsStatus: 'pending', // Default status
        optimizationTips: aiOutput.optimizationTips,
        optimizationTipsStatus: 'pending', // Default status
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
