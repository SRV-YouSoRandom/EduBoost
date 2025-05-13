'use server';
/**
 * @fileOverview Expands a given content idea with more details or a script.
 *
 * - expandContentIdea - A function that generates detailed content for an existing idea.
 * - ExpandContentIdeaInput - The input type for the expandContentIdea function.
 * - ExpandContentIdeaOutput - The return type for the expandContentIdea function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { GenerateContentIdeasInputSchema } from './generate-content-ideas'; // Re-use schema for context

const ExpandContentIdeaInputSchema = z.object({
  ideaText: z.string().describe('The content idea text to be expanded.'),
  institutionContext: GenerateContentIdeasInputSchema.describe('The context of the educational institution for tailoring the expansion.'),
});
export type ExpandContentIdeaInput = z.infer<typeof ExpandContentIdeaInputSchema>;

const ExpandContentIdeaOutputSchema = z.object({
  expandedDetails: z
    .string()
    .describe('Detailed script, outline, or explanation for the content idea, in markdown format.'),
});
export type ExpandContentIdeaOutput = z.infer<typeof ExpandContentIdeaOutputSchema>;

export async function expandContentIdea(
  input: ExpandContentIdeaInput
): Promise<ExpandContentIdeaOutput> {
  return expandContentIdeaFlow(input);
}

const prompt = ai.definePrompt({
  name: 'expandContentIdeaPrompt',
  input: {schema: ExpandContentIdeaInputSchema},
  output: {schema: ExpandContentIdeaOutputSchema},
  prompt: `You are an expert content developer for educational institutions.
  Given the following content idea: "{{ideaText}}"

  And the context of the institution:
  - Name: {{institutionContext.institutionName}}
  - Type: {{institutionContext.institutionType}}
  - Target Audience: {{institutionContext.targetAudience}}
  - Programs Offered: {{institutionContext.programsOffered}}
  - Unique Selling Points: {{institutionContext.uniqueSellingPoints}}

  Please expand this idea into a more detailed piece of content. This could be a short script for a video, a blog post outline, key talking points for a presentation, or a more detailed explanation of the concept.
  Format your output as a single markdown string for the 'expandedDetails' field.
  Focus on making the content engaging and relevant to the institution's target audience and strengths.
  For example, if the idea is "Student success stories", you might provide an outline for a blog post featuring a specific (hypothetical) student, or a short video script template.
  If the idea is "Day in the life of a [Program] student", you might draft a short video script or a photo-essay outline.
  Be creative and practical.
  `,
});

const expandContentIdeaFlow = ai.defineFlow(
  {
    name: 'expandContentIdeaFlow',
    inputSchema: ExpandContentIdeaInputSchema,
    outputSchema: ExpandContentIdeaOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    if (output && output.expandedDetails) {
        return { expandedDetails: output.expandedDetails };
    }
    // Fallback if AI fails to generate details
    return { expandedDetails: "Error: Could not expand the content idea. Please try again." };
  }
);
