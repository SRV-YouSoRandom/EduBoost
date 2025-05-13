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
  currentIdeasJson: z.string().describe("The existing list of content ideas as a JSON string, including their text and status.")
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

Existing Content Ideas (JSON format, includes text and current status. Your output should only be new idea texts):
\`\`\`json
{{{currentIdeasJson}}}
\`\`\`

User's Refinement Request: "{{userPrompt}}"

Based on the user's request, refine the existing list of content ideas.
Your goal is to *incorporate the user's feedback by generating new ideas based on the prompt and appending them to the list of existing ideas that are still relevant and not explicitly asked to be removed or modified*.
- If the user asks to add specific types of ideas (e.g., "more video ideas", "ideas for parents"), generate those new ideas.
- If the user asks to focus on a specific program or theme, generate new ideas reflecting this focus.
- If the user asks to remove certain types of ideas, you should *not* include those types in any *newly generated* ideas. However, existing ideas of that type should generally be preserved unless the prompt explicitly states to remove them.
- *Preserve existing ideas that are still relevant and not directly contradicted by the user's prompt.*
- *Append any newly generated ideas to the end of the list of ideas you generate.*

The output should be a new array of content idea strings *representing the complete, updated list of ideas*.
Do not include IDs, statuses, or expanded details in your direct output.
The final list of ideas you provide MUST NOT exceed 10 items. If the combination of preserved and new ideas exceeds 10, prioritize the most relevant and impactful ones, trying to keep a mix of original and new ideas if possible.

Return the refined list of content idea texts as an array of strings in the 'refinedContentIdeas' field.
  `,
});

const refineContentIdeasFlow = ai.defineFlow(
  {
    name: 'refineContentIdeasFlow',
    inputSchema: RefineContentIdeasInputSchema, // External input schema remains the same
    outputSchema: GenerateContentIdeasOutputSchema,
  },
  async (input): Promise<import('@/ai/schemas/content-ideas-schemas').GenerateContentIdeasOutput> => {
    let currentIdeasJsonString = "[]"; 
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
      const existingIdeasMap = new Map(
        input.currentIdeas.contentIdeas.map(idea => [idea.text.toLowerCase(), idea])
      );
      
      let refinedIdeasWithStatus: ContentIdeaWithStatus[] = aiRefinedOutput.refinedContentIdeas.map((ideaText) => {
        const matchedExistingIdea = existingIdeasMap.get(ideaText.toLowerCase());
        if (matchedExistingIdea) {
          return {
            ...matchedExistingIdea, // Preserve ID, status, details if text matches
            isExpanding: false, // Reset expansion state
          };
        } else {
          // This is a new idea generated by the AI
          return {
            id: crypto.randomUUID(),
            text: ideaText,
            status: 'pending' as Status,
            expandedDetails: undefined, 
            isExpanding: false,
          };
        }
      });

      if (refinedIdeasWithStatus.length > 10) {
        refinedIdeasWithStatus = refinedIdeasWithStatus.slice(0, 10);
      }
      return { contentIdeas: refinedIdeasWithStatus };
    }
    
    console.error("AI failed to generate valid refined content ideas. Returning original ideas, capped if necessary.");
    let originalIdeasCapped = input.currentIdeas;
    if (originalIdeasCapped.contentIdeas.length > 10) {
        originalIdeasCapped = {
            ...originalIdeasCapped,
            contentIdeas: originalIdeasCapped.contentIdeas.slice(0,10)
        }
    }
    return originalIdeasCapped; 
  }
);
