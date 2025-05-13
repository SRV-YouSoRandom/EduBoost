// Use server directive is required for Genkit flows.
'use server';
/**
 * @fileOverview GMB Optimization AI agent.
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
  keywordSuggestions: z.string().describe('A list of keyword suggestions for the GMB profile.'),
  descriptionSuggestions: z.string().describe('Suggested descriptions for the GMB profile.'),
  optimizationTips: z.string().describe('Additional tips for optimizing the GMB profile.'),
});
export type GenerateGMBOptimizationsOutput = z.infer<typeof GenerateGMBOptimizationsOutputSchema>;

export async function generateGMBOptimizations(input: GenerateGMBOptimizationsInput): Promise<GenerateGMBOptimizationsOutput> {
  return generateGMBOptimizationsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateGMBOptimizationsPrompt',
  input: {schema: GenerateGMBOptimizationsInputSchema},
  output: {schema: GenerateGMBOptimizationsOutputSchema},
  prompt: `You are an expert in Google My Business (GMB) optimization for educational institutions.

  Based on the information provided about the institution, generate recommendations for optimizing their GMB profile.
  Include keyword suggestions, engaging description suggestions, and additional optimization tips.

  Institution Name: {{{institutionName}}}
  Institution Type: {{{institutionType}}}
  Location: {{{location}}}
  Programs Offered: {{{programsOffered}}}
  Target Audience: {{{targetAudience}}}
  Unique Selling Points: {{{uniqueSellingPoints}}}`,
});

const generateGMBOptimizationsFlow = ai.defineFlow(
  {
    name: 'generateGMBOptimizationsFlow',
    inputSchema: GenerateGMBOptimizationsInputSchema,
    outputSchema: GenerateGMBOptimizationsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
