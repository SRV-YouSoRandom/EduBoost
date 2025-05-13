// src/ai/flows/generate-local-seo-strategy.ts
'use server';

/**
 * @fileOverview Generates a tailored local SEO strategy for educational institutions.
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

const GenerateLocalSEOStrategyOutputSchema = z.object({
  strategyDocument: z.string().describe('A detailed local SEO strategy document.'),
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
  prompt: `You are an expert in local SEO for educational institutions.

  Based on the following information about the institution, generate a comprehensive local SEO strategy document.

  Institution Name: {{{institutionName}}}
  Location: {{{location}}}
  Programs Offered: {{{programsOffered}}}
  Target Audience: {{{targetAudience}}}
  Website URL: {{{websiteUrl}}}

  The strategy document should include:
  - Keyword research and targeting recommendations
  - Google My Business optimization suggestions
  - Local link building strategies
  - Content marketing ideas focused on local SEO
  - On-page optimization recommendations
  - Technical SEO recommendations
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
    return output!;
  }
);
