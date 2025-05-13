'use server';

/**
 * @fileOverview Generates a performance marketing strategy document for educational institutions.
 *
 * - generatePerformanceMarketingStrategy - A function that generates the strategy.
 * - GeneratePerformanceMarketingStrategyInput - The input type for the generatePerformanceMarketingStrategy function.
 * - GeneratePerformanceMarketingStrategyOutput - The return type for the generatePerformanceMarketingStrategy function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GeneratePerformanceMarketingStrategyInputSchema = z.object({
  institutionName: z.string().describe('The name of the educational institution.'),
  institutionType: z
    .string()
    .describe(
      'The type of educational institution (e.g., university, college, vocational school).'
    ),
  targetAudience: z
    .string()
    .describe(
      'The target audience for the marketing strategy (e.g., prospective students, parents).'
    ),
  programmesOffered: z
    .string()
    .describe('A description of the programmes offered by the institution'),
  location: z.string().describe('The location of the educational institution.'),
  marketingBudget: z
    .string()
    .describe('The marketing budget allocated to the insitution.'),
  marketingGoals: z.string().describe('The goals of the marketing campaign.'),
});
export type GeneratePerformanceMarketingStrategyInput = z.infer<
  typeof GeneratePerformanceMarketingStrategyInputSchema
>;

const GeneratePerformanceMarketingStrategyOutputSchema = z.object({
  marketingStrategyDocument: z
    .string()
    .describe(
      'A detailed performance marketing strategy document outlining recommended platforms and approaches.'
    ),
});
export type GeneratePerformanceMarketingStrategyOutput = z.infer<
  typeof GeneratePerformanceMarketingStrategyOutputSchema
>;

export async function generatePerformanceMarketingStrategy(
  input: GeneratePerformanceMarketingStrategyInput
): Promise<GeneratePerformanceMarketingStrategyOutput> {
  return generatePerformanceMarketingStrategyFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generatePerformanceMarketingStrategyPrompt',
  input: {schema: GeneratePerformanceMarketingStrategyInputSchema},
  output: {schema: GeneratePerformanceMarketingStrategyOutputSchema},
  prompt: `You are an expert performance marketing strategist specializing in educational institutions.

  Based on the information provided about the institution, its target audience, and its goals, develop a comprehensive performance marketing strategy document.
  The document should outline specific platforms and approaches that the institution should use to achieve its marketing goals. Detail strategies optimized for student recruitment, brand awareness, and community engagement.

  Institution Name: {{{institutionName}}}
  Institution Type: {{{institutionType}}}
  Target Audience: {{{targetAudience}}}
  Programmes Offered: {{{programmesOffered}}}
  Location: {{{location}}}
  Marketing Budget: {{{marketingBudget}}}
  Marketing Goals: {{{marketingGoals}}}

  Respond with a well-structured document in markdown format that includes:
  - An executive summary.
  - Target audience analysis.
  - Recommended platforms (e.g., Google Ads, Facebook, Instagram, LinkedIn, TikTok).
  - Budget allocation per platform.
  - Key performance indicators (KPIs).
  - Timeline and milestones.
  - Competitor analysis.
  - Content marketing suggestions
  - Call to action (CTA) examples.
  - Conclusion.
  `,
});

const generatePerformanceMarketingStrategyFlow = ai.defineFlow(
  {
    name: 'generatePerformanceMarketingStrategyFlow',
    inputSchema: GeneratePerformanceMarketingStrategyInputSchema,
    outputSchema: GeneratePerformanceMarketingStrategyOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

