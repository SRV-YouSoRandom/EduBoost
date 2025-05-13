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
  GMBKeywordSuggestionSchema, 
  GMBAIPromptOutputSchema,
  AIKeywordSuggestionSchema, 
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
  prompt: `You are an expert in Google My Business (GMB) optimization specifically for educational institutions, deeply familiar with all GMB features and Google's best practices.

  Based on the information provided:
  Institution Name: {{{institutionName}}}
  Institution Type: {{{institutionType}}}
  Location: {{{location}}}
  Programs Offered: {{{programsOffered}}}
  Target Audience: {{{targetAudience}}}
  Unique Selling Points: {{{uniqueSellingPoints}}}

  Provide your output as a single, valid JSON object adhering to the defined schema.

  **1. Keyword Suggestions ('keywordSuggestions'):**
  - Provide an array of 5-7 keyword objects. Each object must include:
    - "text": The keyword suggestion (e.g., "Preschool {{{location}}}", "{{{institutionType}}} near me", "Best STEM programs {{{location}}}", "after-school care {{{location}}}").
    - "searchVolumeLast24h": An *estimated* search volume (e.g., 'approx. 5-10', 'low', 'medium', 'high', 'unavailable'). If unavailable, state 'unavailable'.
    - "searchVolumeLast7d": An *estimated* search volume (e.g., 'approx. 50-70', 'medium-high', 'high', 'unavailable'). If unavailable, state 'unavailable'.
  - Include a mix of:
    - **Broad local keywords:** (e.g., "{{{institutionType}}} {{{location}}}")
    - **Program-specific keywords:** (e.g., "coding bootcamp {{{location}}}", "montessori preschool {{{location}}}").
    - **Long-tail keywords:** (e.g., "best {{{institutionType}}} for special needs in {{{location}}}", "evening {{{programsOffered}}} classes in {{{location}}}")
    - **Location + modifier keywords:** (e.g., "top-rated {{{institutionType}}} {{{location}}}", "affordable {{{programsOffered}}} {{{location}}}")

  **2. Description Suggestions ('descriptionSuggestions'):**
  - Craft an engaging GMB business description (max 750 characters). Use markdown for light formatting (bolding key phrases).
  - Highlight unique selling points, programs offered, and target audience.
  - Include a clear call to action (e.g., "Visit our website to learn more!", "Schedule a tour today!").
  - Example: "**{{{institutionName}}}** in **{{{location}}}** offers exceptional [Program Type, e.g., Early Childhood Education] programs for {{{targetAudience}}}. We focus on [Unique Selling Point 1, e.g., hands-on learning] and [Unique Selling Point 2, e.g., small class sizes]. Our curriculum includes: {{{programsOffered}}}. Discover a nurturing and stimulating learning environment. Schedule your visit today!"

  **3. Optimization Tips ('optimizationTips'):**
  - Provide a comprehensive markdown list of actionable tips covering these GMB features with specific examples relevant to the institution:
    - **GMB Posts:** Suggest types of posts (Events, Offers, What's New, COVID-19 updates if relevant) and optimal frequency. Example: "Post weekly 'Student Spotlight' or 'Teacher Tuesday' features. Announce open house events 2 weeks in advance using an Event post."
    - **Q&A Feature:** Advise on pre-populating with 5-7 common questions (and answers) and promptly answering new user questions. Example: "Pre-fill Q&A with: 'What are your admission requirements?', 'What are your hours?', 'Do you offer financial aid?'"
    - **Photos & Videos:** Recommend types of visuals (campus tour, classroom activities, student projects, staff introductions, virtual tour if possible) and regular uploads (e.g., 5 new photos monthly). Emphasize high-quality, well-lit images.
    - **Services/Products:** Detail how to list {{{programsOffered}}} effectively, including descriptions and potentially calls to action for each service. Example: "List 'Preschool Program', 'Kindergarten Program', 'After-School Tutoring' as distinct services. For each, describe curriculum highlights and age suitability."
    - **Reviews Management:** Outline a strategy for ethically encouraging reviews and responding to ALL reviews (positive and negative) professionally and promptly (within 24-48 hours), incorporating keywords where natural.
    - **Attributes:** Suggest highly relevant GMB attributes to select (e.g., 'Online appointments', 'Onsite services', 'Wheelchair accessible entrance', 'Free Wi-Fi', 'Identifies as women-led').
    - **Messaging:** Stress the importance of enabling GMB messaging and responding to inquiries quickly (within a few hours if possible).
    - **NAP Consistency:** Briefly reiterate the importance of consistent Name, Address, and Phone number across all online listings.

  Ensure all outputs strictly adhere to the formatting requested in their descriptions.
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
        keywordSuggestionsSectionStatus: 'pending', 
        descriptionSuggestions: aiOutput.descriptionSuggestions,
        descriptionSuggestionsStatus: 'pending', 
        optimizationTips: aiOutput.optimizationTips,
        optimizationTipsStatus: 'pending', 
      };
    }
    // Fallback error structure matching the output schema
    return { 
      keywordSuggestions: [],
      keywordSuggestionsSectionStatus: 'pending',
      descriptionSuggestions: "Error: Could not generate description suggestions. Please try again or refine your input.",
      descriptionSuggestionsStatus: 'pending',
      optimizationTips: "- Error: Could not generate optimization tips. Please try again or refine your input.",
      optimizationTipsStatus: 'pending',
    };
  }
);
