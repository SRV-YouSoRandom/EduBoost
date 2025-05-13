
'use server';

/**
 * @fileOverview Generates a performance marketing strategy document for educational institutions using Google Marketing Platform tools.
 *
 * - generatePerformanceMarketingStrategy - A function that generates the strategy.
 * - GeneratePerformanceMarketingStrategyInput - The input type for the generatePerformanceMarketingStrategy function.
 * - GeneratePerformanceMarketingStrategyOutput - The return type for the generatePerformanceMarketingStrategy function.
 */

import {ai} from '@/ai/genkit';
import type { Status } from '@/types/common';
import {
  GeneratePerformanceMarketingStrategyInputSchema,
  GeneratePerformanceMarketingStrategyOutputSchema,
  PerformanceMarketingAIPromptOutputSchema,
} from '@/ai/schemas/performance-marketing-schemas';

export type { 
  GeneratePerformanceMarketingStrategyInput, 
  GeneratePerformanceMarketingStrategyOutput 
} from '@/ai/schemas/performance-marketing-schemas';


export async function generatePerformanceMarketingStrategy(
  input: import('@/ai/schemas/performance-marketing-schemas').GeneratePerformanceMarketingStrategyInput
): Promise<import('@/ai/schemas/performance-marketing-schemas').GeneratePerformanceMarketingStrategyOutput> {
  return generatePerformanceMarketingStrategyFlow(input);
}


const prompt = ai.definePrompt({
  name: 'generatePerformanceMarketingStrategyPrompt',
  input: {schema: GeneratePerformanceMarketingStrategyInputSchema},
  output: {schema: PerformanceMarketingAIPromptOutputSchema}, // AI produces the markdown string
  prompt: `You are an expert performance marketing strategist specializing in educational institutions, with extensive experience using Google Marketing Platform tools like Google Ads and Google Analytics.

  Based on the information provided, develop a comprehensive performance marketing strategy.
  Your entire response for the 'marketingStrategyDocument' field MUST be a single, well-structured markdown document. Do NOT output a JSON object. The output should be ready to be rendered directly as markdown.

  Institution Name: {{{institutionName}}}
  Institution Type: {{{institutionType}}}
  Target Audience: {{{targetAudience}}}
  Programs Offered: {{{programsOffered}}}
  Location/Target Market: {{{location}}}
  Marketing Budget: {{{marketingBudget}}}
  Marketing Goals: {{{marketingGoals}}}

  The markdown strategy document must include the following sections with actionable advice:

  ## 1. Executive Summary
  - Briefly outline the core strategy and expected outcomes.

  ## 2. Target Audience Deep Dive
  - Analyze the provided '{{{targetAudience}}}'.
  - Suggest potential audience segments for Google Ads (e.g., In-Market audiences for Education, Custom Audiences based on competitor website visits, Affinity Audiences).
  - Consider demographics, interests, and online behaviors relevant for targeting on platforms like Google Search, YouTube, and Display Network.

  ## 3. Recommended Platforms & Strategy
  - **Google Ads (Primary Focus):**
    - **Search Campaigns:** Suggest campaign structure, ad group themes based on '{{{programsOffered}}}' and '{{{marketingGoals}}}'. Provide 2-3 example ad copy headlines and descriptions. Recommend keyword match types.
    - **Display Campaigns:** When and how to use Display campaigns (e.g., remarketing, awareness). Suggest targeting options.
    - **YouTube Campaigns:** If relevant for '{{{targetAudience}}}', suggest video ad formats (e.g., in-stream, discovery) and targeting.
    - **Performance Max Campaigns:** Discuss potential benefits for achieving '{{{marketingGoals}}}'.
  - **Other Platforms (Briefly, if budget allows):**
    - Social Media Ads (e.g., Facebook/Instagram, LinkedIn): Briefly mention if suitable for the target audience and goals.

  ## 4. Budget Allocation (Indicative)
  - Based on '{{{marketingBudget}}}', suggest a percentage or range allocation across the primary recommended platforms (especially Google Ads campaigns).
  - Example: Google Search (60-70%), Google Display/YouTube (20-30%), Other (0-10%).

  ## 5. Key Performance Indicators (KPIs) & Tracking
  - **Google Analytics:** Stress setting up conversion tracking for goals like application submissions, brochure downloads, or contact form fills.
  - **KPIs:** List specific, measurable KPIs relevant to '{{{marketingGoals}}}'. Examples:
    - Cost Per Acquisition (CPA) for enrollments/leads.
    - Click-Through Rate (CTR) for ads.
    - Conversion Rate from website visits.
    - Impressions and Reach for awareness goals.
    - View-through conversions for video/display.

  ## 6. Content & Creative Suggestions
  - **Ad Copy:** Emphasize clear Calls to Action (CTAs) and highlighting Unique Selling Points from '{{{programsOffered}}}'.
  - **Landing Pages:** Importance of dedicated, optimized landing pages for ad campaigns.
  - **Visuals:** Briefly suggest types of visuals for display or video ads.

  ## 7. Timeline & Milestones (High-Level)
  - Suggest a phased approach if applicable (e.g., Month 1: Setup & Launch Search, Month 2: Optimize & Add Remarketing).

  ## 8. Conclusion & Next Steps
  - Summarize the strategy and suggest immediate next actions.

  Ensure the entire output for 'marketingStrategyDocument' is a single, valid, and comprehensive markdown string. Use clear headings, bullet points, and bold text for readability.
  `,
});

const generatePerformanceMarketingStrategyFlow = ai.defineFlow(
  {
    name: 'generatePerformanceMarketingStrategyFlow',
    inputSchema: GeneratePerformanceMarketingStrategyInputSchema,
    outputSchema: GeneratePerformanceMarketingStrategyOutputSchema, // Flow output includes status
  },
  async (input): Promise<import('@/ai/schemas/performance-marketing-schemas').GeneratePerformanceMarketingStrategyOutput> => {
    const {output: aiOutput} = await prompt(input);
    if (aiOutput && aiOutput.marketingStrategyDocument) {
      return { 
        marketingStrategyDocument: aiOutput.marketingStrategyDocument,
        documentStatus: 'pending' as Status, // Set default status
      };
    }
    // Fallback or error handling if AI fails to generate the document
    return { 
      marketingStrategyDocument: "# Error\n\nFailed to generate performance marketing strategy. Please try again.",
      documentStatus: 'pending' as Status, // Default status even for error
    };
  }
);

