'use server';
/**
 * @fileOverview Expands a given content idea with more details or a script.
 *
 * - expandContentIdea - A function that generates detailed content for an existing idea.
 * - ExpandContentIdeaInput - The input type for the expandContentIdea function.
 * - ExpandContentIdeaOutput - The return type for the expandContentIdea function.
 */

import {ai} from '@/ai/genkit';
import {
  ExpandContentIdeaInputSchema,
  ExpandContentIdeaOutputSchema,
  GenerateContentIdeasInputSchema, // Used by ExpandContentIdeaInputSchema for institutionContext
} from '@/ai/schemas/content-ideas-schemas';

// Export types for external use
export type { ExpandContentIdeaInput, ExpandContentIdeaOutput, GenerateContentIdeasInput } from '@/ai/schemas/content-ideas-schemas';


export async function expandContentIdea(
  input: import('@/ai/schemas/content-ideas-schemas').ExpandContentIdeaInput
): Promise<import('@/ai/schemas/content-ideas-schemas').ExpandContentIdeaOutput> {
  return expandContentIdeaFlow(input);
}

const prompt = ai.definePrompt({
  name: 'expandContentIdeaPrompt',
  input: {schema: ExpandContentIdeaInputSchema},
  output: {schema: ExpandContentIdeaOutputSchema},
  prompt: `You are an expert content developer and scriptwriter for educational institutions.
  Your task is to expand the given content idea into a more detailed and actionable piece of content.

  Content Idea: "{{ideaText}}"

  Institution Context:
  - Name: {{institutionContext.institutionName}}
  - Type: {{institutionContext.institutionType}}
  - Target Audience: {{institutionContext.targetAudience}}
  - Programs Offered: {{institutionContext.programsOffered}}
  - Unique Selling Points: {{institutionContext.uniqueSellingPoints}}

  Instructions for Expansion:
  1.  **Determine Format:** Based on the idea, decide on the most suitable format for expansion. This could be:
      *   A short video script (e.g., for a 30-60 second social media video or a 2-3 minute informational piece). Include scene suggestions or visual cues if applicable.
      *   A blog post outline (with key sections, subheadings, and talking points for each).
      *   Key talking points for a presentation or webinar.
      *   A detailed explanation or narrative for an infographic.
      *   A concept for an interactive social media post (e.g., poll questions, Q&A prompts).
  2.  **Detailed Content:** Provide specific details, examples, and practical information.
      *   If a script, write out dialogue or voiceover.
      *   If an outline, list specific points to cover under each heading.
  3.  **Engaging & Relevant:** Make the content engaging, informative, and directly relevant to the institution's {{targetAudience}}, highlighting its {{programsOffered}} and {{uniqueSellingPoints}}.
  4.  **Action-Oriented (if applicable):** Include a call to action if appropriate for the content type (e.g., "Visit our website to learn more," "Apply now," "Join our upcoming webinar").
  5.  **Output:** Format your output as a single markdown string for the 'expandedDetails' field. Use markdown for structure (headings, lists, bolding).

  Example Scenario:
  If the idea is "Showcase our state-of-the-art science labs" for a high school targeting prospective students and parents, you might:
  - Draft a short video script with a student host touring the labs, highlighting specific equipment (USP) and how it's used in the curriculum (Programs Offered).
  - Or, create a blog post outline detailing lab features, student projects, and teacher expertise.

  Be creative, practical, and ensure the expanded content is valuable and compelling.
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
    return { expandedDetails: "Error: Could not expand the content idea. Please try again. Consider rephrasing the original idea or providing more context if this issue persists." };
  }
);
