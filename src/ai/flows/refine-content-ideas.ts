'use server';
/**
 * @fileOverview Refines an existing list of content ideas based on user prompts.
 *
 * - refineContentIdeas - A function that takes existing ideas and a user prompt to generate a refined list.
 * - RefineContentIdeasInput - The input type for the refineContentIdeas function.
 * - GenerateContentIdeasOutput - The return type (re-uses the output schema from the generation flow).
 */

import { ai } from '@/ai/genkit';
import type { Status } from '@/types/common';
import {
  RefineContentIdeasInputSchema,
  GenerateContentIdeasOutputSchema,
  RefineContentIdeasPromptOutputSchema,
  ContentIdeaWithStatus,
  GenerateContentIdeasInputSchema, // For institutionContext
} from '@/ai/schemas/content-ideas-schemas';
import { z } from 'zod';

export type { RefineContentIdeasInput, GenerateContentIdeasOutput } from '@/ai/schemas/content-ideas-schemas';

export async function refineContentIdeas(
  input: import('@/ai/schemas/content-ideas-schemas').RefineContentIdeasInput
): Promise<import('@/ai/schemas/content-ideas-schemas').GenerateContentIdeasOutput> {
  return refineContentIdeasFlow(input);
}

// Define a new schema for the prompt's input, including the pre-serialized JSON string
const RefineContentIdeasPromptInputInternalSchema = RefineContentIdeasInputSchema.extend({
  currentIdeasJson: z.string().describe("The existing list of content ideas as a JSON string.")
});

const refinePrompt = ai.definePrompt({
  name: 'refineContentIdeasPrompt',
  input: { schema: RefineContentIdeasPromptInputInternalSchema }, // Use the internal schema
  output: { schema: RefineContentIdeasPromptOutputSchema }, // AI returns a list of strings
  prompt: `You are an expert content strategist for educational institutions.
You are given an existing list of content ideas and a user prompt asking for modifications.

Institution Context:
  Name: {{institutionContext.institutionName}}
  Type: {{institutionContext.institutionType}}
  Target Audience: {{institutionContext.targetAudience}}
  Programs Offered: {{institutionContext.programsOffered}}
  Unique Selling Points: {{institutionContext.uniqueSellingPoints}}

Existing Content Ideas (some may have expanded details, focus on refining the idea texts):
\`\`\`json
{{{currentIdeasJson}}}
\`\`\`

User's Refinement Request: "{{userPrompt}}"

Based on a user's request, refine the existing list of content ideas.
- If the user asks to add new types of ideas (e.g., "more video ideas", "ideas for parents"), generate those.
- If the user asks to focus on a specific program or theme, tailor existing ideas or add new ones.
- If the user asks to remove certain types of ideas, omit them from the new list.
- Try to preserve the essence of existing ideas that are still relevant unless the prompt suggests otherwise.
- The output should be a new array of content idea strings. Do not include IDs, statuses, or expanded details in your direct output.

Return the refined list of content idea texts as an array of strings in the 'refinedContentIdeas' field.
  `,
  // Removed helpers block as jsonEncode is no longer used in the template
});

const refineContentIdeasFlow = ai.defineFlow(
  {
    name: 'refineContentIdeasFlow',
    inputSchema: RefineContentIdeasInputSchema, // External input schema remains the same
    outputSchema: GenerateContentIdeasOutputSchema,
  },
  async (input): Promise<import('@/ai/schemas/content-ideas-schemas').GenerateContentIdeasOutput> => {
    // Pre-serialize currentIdeas.contentIdeas to a JSON string
    let currentIdeasJsonString = "[]"; // Default to empty array string
    if (input.currentIdeas && Array.isArray(input.currentIdeas.contentIdeas)) {
      currentIdeasJsonString = JSON.stringify(
        input.currentIdeas.contentIdeas.map(idea => ({ text: idea.text, status: idea.status })),
        null,
        2
      );
    }
    
    const promptInput = {
      ...input,
      currentIdeasJson: currentIdeasJsonString,
    };

    const { output: aiRefinedOutput } = await refinePrompt(promptInput);

    if (aiRefinedOutput && aiRefinedOutput.refinedContentIdeas) {
      const refinedIdeasWithStatus: ContentIdeaWithStatus[] = aiRefinedOutput.refinedContentIdeas.map((ideaText) => {
        // Try to find a matching existing idea to preserve its ID, status, and details if relevant
        const existingIdea = input.currentIdeas.contentIdeas.find(
          (idea) => idea.text.toLowerCase() === ideaText.toLowerCase()
        );
        return {
          id: existingIdea?.id || crypto.randomUUID(),
          text: ideaText,
          status: existingIdea?.status || ('pending' as Status),
          expandedDetails: existingIdea?.expandedDetails, // Preserve details if text matches
          isExpanding: false, // Reset expansion state
        };
      });
      return { contentIdeas: refinedIdeasWithStatus };
    }
    
    // Fallback: return original ideas or an error message
    // For now, returning original ideas if refinement fails.
    console.error("AI failed to generate valid refined content ideas.");
    return input.currentIdeas; 
  }
);
