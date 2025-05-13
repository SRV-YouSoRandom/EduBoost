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
  prompt: `You are an expert performance marketing strategist specializing in educational institutions, with extensive experience using Google Marketing Platform tools, particularly Google Ads (Search, Display, YouTube, Performance Max) and Google Analytics.

  Based on the information provided, develop a comprehensive performance marketing strategy.
  Your entire response for the 'marketingStrategyDocument' field MUST be a single, well-structured markdown document. Do NOT output a JSON object. The output should be ready to be rendered directly as markdown.

  Institution Name: {{{institutionName}}}
  Institution Type: {{{institutionType}}}
  Target Audience: {{{targetAudience}}}
  Programs Offered: {{{programsOffered}}}
  Location/Target Market: {{{location}}}
  Marketing Budget: {{{marketingBudget}}} (Interpret this as a guideline, focus on strategic recommendations first)
  Marketing Goals: {{{marketingGoals}}}

  The markdown strategy document must include the following sections with specific, actionable advice, heavily emphasizing Google tools:

  ## 1. Executive Summary
  - Briefly outline the core strategy focusing on achieving '{{{marketingGoals}}}' using Google Marketing Platform, and expected outcomes.

  ## 2. Target Audience Deep Dive & Google Ads Targeting
  - Analyze '{{{targetAudience}}}'.
  - Suggest specific Google Ads targeting options:
    - **In-Market Audiences:** (e.g., "Education > Higher Education", "Education > Test Preparation & Tutoring") relevant to '{{{programsOffered}}}'.
    - **Affinity Audiences:** (e.g., "Aspiring Students", "Parents of School-Age Children")
    - **Custom Audiences:** Based on search terms related to '{{{programsOffered}}}' or competitor websites (if applicable).
    - **Demographics & Location Targeting:** For '{{{location}}}' and relevant age groups.
    - **Remarketing Lists:** For website visitors who didn't convert (setup via Google Analytics tag).
  - Mention how these audiences can be leveraged on Google Search, YouTube, and Display Network.

  ## 3. Recommended Platforms & Google Ads Campaign Strategy
  - **Google Ads (Primary Focus):**
    - **Search Campaigns:**
        - Suggest campaign structure (e.g., one campaign per major program category from '{{{programsOffered}}}').
        - Ad Group themes based on specific courses or student needs.
        - Provide 2-3 example ad copy headlines (e.g., "Enroll in [Program Name] Today!", "[Institution Name] - Apply Now", "Learn [Skill] at [Institution Name]") and descriptions (highlighting USPs and CTAs).
        - Recommend keyword match types (start with phrase and broad match modifier, monitor closely). Suggest using Google Keyword Planner for keyword research.
        - Emphasize use of ad extensions (sitelinks, callouts, structured snippets relevant to education).
    - **Display Campaigns:**
        - When/how to use (e.g., remarketing to past website visitors, awareness campaigns using custom affinity audiences).
        - Suggest targeting options (managed placements on relevant educational sites, topics like "Education").
    - **YouTube Campaigns:**
        - If relevant for '{{{targetAudience}}}' (e.g., younger demographic), suggest video ad formats (e.g., in-stream skippable, in-feed video ads) and targeting (e.g., relevant YouTube channels, custom audiences).
    - **Performance Max Campaigns (PMax):**
        - Discuss potential benefits for achieving '{{{marketingGoals}}}' across Google's network, especially for lead generation or enrollment goals. Mention providing strong asset groups.
  - **Other Platforms (Briefly, if budget and goals align):**
    - Social Media Ads (e.g., Facebook/Instagram for visual programs, LinkedIn for professional courses): Briefly mention suitability.

  ## 4. Budget Allocation (Indicative - Focus on Google Ads)
  - Based on '{{{marketingBudget}}}', suggest a *percentage or priority-based* allocation for Google Ads campaigns.
  - Example: Google Search (60-70% - high intent), Google Display/YouTube/PMax (20-30% - broader reach/remarketing), Other (0-10%).
  - Stress that budget should be flexible and optimized based on performance data from Google Analytics and Google Ads.

  ## 5. Key Performance Indicators (KPIs) & Tracking with Google Analytics
  - **Google Analytics:**
    - Stress setting up robust conversion tracking for all '{{{marketingGoals}}}' (e.g., application form submissions, brochure downloads, campus tour requests, contact form fills).
    - Mention using UTM parameters for all campaigns to track performance accurately in Google Analytics.
    - Importance of linking Google Ads and Google Analytics.
  - **KPIs:** List specific, measurable KPIs relevant to '{{{marketingGoals}}}', tracked via Google Ads & Analytics. Examples:
    - Cost Per Acquisition (CPA) for enrollments/leads.
    - Click-Through Rate (CTR) for ads.
    - Conversion Rate (e.g., website visit to lead).
    - Impressions and Reach (for awareness goals).
    - Return on Ad Spend (ROAS) if applicable.
    - Google Ads Quality Score and Ad Relevance.

  ## 6. Content & Creative Suggestions for Google Ads
  - **Ad Copy:** Emphasize clear Calls to Action (CTAs), highlighting '{{{uniqueSellingPoints}}}' and benefits of '{{{programsOffered}}}'. Use A/B testing for ad copy in Google Ads.
  - **Landing Pages:** Stress the importance of dedicated, optimized landing pages for ad campaigns, with content matching ad copy and clear conversion paths.
  - **Visuals for Display/YouTube:** Briefly suggest types of visuals (student testimonials, campus shots, program highlights).

  ## 7. Timeline & Milestones (High-Level)
  - Suggest a phased approach (e.g., Month 1: Setup Google Analytics tracking, launch initial Search campaigns. Month 2: Optimize Search, launch Remarketing. Month 3: Explore Display/YouTube/PMax based on data).

  ## 8. Conclusion & Next Steps
  - Summarize the Google-centric strategy and suggest immediate next actions (e.g., "Audit current Google Analytics setup", "Begin keyword research using Google Keyword Planner").

  Ensure the entire output for 'marketingStrategyDocument' is a single, valid, and comprehensive markdown string. Use clear headings, bullet points, and bold text for readability.
  `,
});

const generatePerformanceMarketingStrategyFlow = ai.defineFlow(
  {
    name: 'generatePerformanceMarketingStrategyFlow',
    inputSchema: GeneratePerformanceMarketingStrategyInputSchema,
    outputSchema: GeneratePerformanceMarketingStrategyOutputSchema, 
  },
  async (input): Promise<import('@/ai/schemas/performance-marketing-schemas').GeneratePerformanceMarketingStrategyOutput> => {
    const {output: aiOutput} = await prompt(input);
    if (aiOutput && aiOutput.marketingStrategyDocument) {
      return { 
        marketingStrategyDocument: aiOutput.marketingStrategyDocument,
        documentStatus: 'pending' as Status, 
      };
    }
    return { 
      marketingStrategyDocument: "# Error\n\nFailed to generate performance marketing strategy. Please ensure all input fields are detailed and try again. Check the Google Marketing Platform for specific tools and insights that might inform your input.",
      documentStatus: 'pending' as Status, 
    };
  }
);
