// src/ai/schemas/content-ideas-schemas.ts
import { z } from 'genkit';
import type { Status } from '@/types/common';

// Schemas for generateContentIdeas flow
export const GenerateContentIdeasInputSchema = z.object({
  institutionName: z.string().describe('The name of the educational institution.'),
  institutionType: z
    .string()
    .describe(
      'The type of educational institution (e.g., university, high school, elementary school).'
    ),
  targetAudience: z
    .string()
    .describe(
      'The target audience for the content (e.g., prospective students, current students, parents, faculty).'
    ),
  programsOffered: z
    .string()
    .describe('A description of the programs offered by the institution.'),
  uniqueSellingPoints: z
    .string()
    .describe('The unique selling points of the educational institution.'),
});
export type GenerateContentIdeasInput = z.infer<
  typeof GenerateContentIdeasInputSchema
>;

export const ContentIdeaWithStatusSchema = z.object({
  id: z.string().describe('Unique identifier for the content idea.'),
  text: z.string().describe('The content idea text.'),
  status: z.enum(['pending', 'inProgress', 'done', 'rejected']).default('pending' as Status).describe('The status of the content idea.'),
  expandedDetails: z.string().optional().describe('Generated detailed script or explanation for the content idea.'),
  isExpanding: z.boolean().optional().describe('Flag to indicate if details are currently being expanded for this idea.'),
});
export type ContentIdeaWithStatus = z.infer<typeof ContentIdeaWithStatusSchema>;

export const GenerateContentIdeasOutputSchema = z.object({
  contentIdeas: z
    .array(ContentIdeaWithStatusSchema)
    .describe('A list of content ideas tailored to the educational institution, each with an ID and status.'),
});
export type GenerateContentIdeasOutput = z.infer<
  typeof GenerateContentIdeasOutputSchema
>;

// Schema for the AI prompt output in generateContentIdeas flow
export const GenerateContentIdeasPromptOutputSchema = z.object({
  contentIdeas: z.array(z.string()).describe('A list of content idea strings.'),
});
export type GenerateContentIdeasPromptOutput = z.infer<typeof GenerateContentIdeasPromptOutputSchema>;


// Schemas for expandContentIdea flow
export const ExpandContentIdeaInputSchema = z.object({
  ideaText: z.string().describe('The content idea text to be expanded.'),
  institutionContext: GenerateContentIdeasInputSchema.describe('The context of the educational institution for tailoring the expansion.'),
});
export type ExpandContentIdeaInput = z.infer<typeof ExpandContentIdeaInputSchema>;

export const ExpandContentIdeaOutputSchema = z.object({
  expandedDetails: z
    .string()
    .describe('Detailed script, outline, or explanation for the content idea, in markdown format.'),
});
export type ExpandContentIdeaOutput = z.infer<typeof ExpandContentIdeaOutputSchema>;
