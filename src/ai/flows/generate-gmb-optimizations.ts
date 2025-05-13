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

const GenerateGMBOptimizationsInputSchema = z.object({
  institutionName: z.string().describe('The name of the educational institution.'),
  institutionType: z.string().describe('The type of educational institution (e.g., university, high school, elementary school).'),
  location: z.string().describe('The location of the institution (city, state).'),
  programsOffered: z.string().describe('A description of the programs and courses offered.'),
  targetAudience: z.string().describe('The target audience of the institution (e.g., prospective students, parents).'),
  uniqueSellingPoints: z.string().describe('The unique selling points or advantages of the institution.'),
});
export type GenerateGMBOptimizationsInput = z.infer<typeof GenerateGMBOptimizationsInputSchema>;

const GenerateGMBOptimizationsOutputSchema = z.object({
  keywordSuggestions: z.string().describe('A markdown list of keyword suggestions for the GMB profile.'),
  descriptionSuggestions: z.string().describe('Suggested GMB business description in markdown format, highlighting unique selling points and programs.'),
  optimizationTips: z.string().describe('Additional GMB optimization tips in markdown format, covering posts, Q&A, photos, services, and reviews, referencing Google My Business features.'),
});
export type GenerateGMBOptimizationsOutput = z.infer<typeof GenerateGMBOptimizationsOutputSchema>;

export async function generateGMBOptimizations(input: GenerateGMBOptimizationsInput): Promise<GenerateGMBOptimizationsOutput> {
  return generateGMBOptimizationsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateGMBOptimizationsPrompt',
  input: {schema: GenerateGMBOptimizationsInputSchema},
  output: {schema: GenerateGMBOptimizationsOutputSchema},
  prompt: `You are an expert in Google My Business (GMB) optimization for educational institutions, leveraging all features of the GMB platform.

  Based on the information provided, generate specific, actionable recommendations for optimizing their GMB profile.

  Institution Name: {{{institutionName}}}
  Institution Type: {{{institutionType}}}
  Location: {{{location}}}
  Programs Offered: {{{programsOffered}}}
  Target Audience: {{{targetAudience}}}
  Unique Selling Points: {{{uniqueSellingPoints}}}

  Provide your output in the following structure:

  **Keyword Suggestions:**
  Present as a markdown list. Include a mix of general and specific local keywords.
  Example:
  \`\`\`markdown
  - Preschool [Location]
  - {{{institutionType}}} near me
  - Best [Program Type, e.g., STEM] programs [Location]
  - {{{institutionName}}} admissions
  \`\`\`

  **Description Suggestions:**
  Craft an engaging GMB business description (max 750 characters). Use markdown for light formatting if needed (bolding key phrases). Highlight unique selling points and programs.
  Example:
  \`\`\`markdown
  **{{{institutionName}}}** in [Location] offers exceptional [Program Type] programs for {{{targetAudience}}}. We focus on [Unique Selling Point 1] and [Unique Selling Point 2]. Our curriculum includes: {{{programsOffered}}}. Visit us to discover a nurturing learning environment!
  \`\`\`

  **Additional Optimization Tips:**
  Provide a markdown list of actionable tips covering these GMB features:
  - **GMB Posts:** Suggest types of posts (events, offers, news) and frequency.
  - **Q&A Feature:** Advise on populating common questions and promptly answering new ones.
  - **Photos & Videos:** Recommend types of visuals (campus, classrooms, activities, staff) and regular uploads.
  - **Services/Products:** How to list {{{programsOffered}}} effectively.
  - **Reviews Management:** Strategy for encouraging and responding to reviews.
  - **Attributes:** Suggest relevant GMB attributes to select (e.g., accessibility, amenities).
  - **Messaging:** Importance of enabling and responding to GMB messages.
  Example:
  \`\`\`markdown
  - **GMB Posts:** Share weekly updates about student achievements or upcoming open house events. Use compelling images.
  - **Q&A:** Add 5-10 common questions parents ask about admissions, curriculum, and facilities.
  - **Photos:** Upload at least 10 high-quality photos showcasing your campus, classrooms, and student activities this month. Add a virtual tour if possible.
  - **Services:** List each main program offered (e.g., "Preschool Program", "Kindergarten Program") with detailed descriptions and even pricing if applicable.
  - **Reviews:** Actively request reviews from happy parents and respond to all reviews (positive and negative) within 24-48 hours.
  \`\`\`
  Ensure all outputs adhere to the markdown formatting requested in their descriptions.
  `,
});

const generateGMBOptimizationsFlow = ai.defineFlow(
  {
    name: 'generateGMBOptimizationsFlow',
    inputSchema: GenerateGMBOptimizationsInputSchema,
    outputSchema: GenerateGMBOptimizationsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
     if (!output || !output.keywordSuggestions || !output.descriptionSuggestions || !output.optimizationTips) {
      return { 
        keywordSuggestions: "- Error: Could not generate keyword suggestions.",
        descriptionSuggestions: "Error: Could not generate description suggestions.",
        optimizationTips: "- Error: Could not generate optimization tips."
      };
    }
    return output;
  }
);
