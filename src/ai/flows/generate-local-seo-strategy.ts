// src/ai/flows/generate-local-seo-strategy.ts
'use server';

/**
 * @fileOverview Generates a tailored local SEO strategy for educational institutions using Google's SEO tools.
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
  strategyDocument: z.string().describe('A detailed local SEO strategy as a well-formatted markdown document.'),
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
  prompt: `You are an expert local SEO strategist specializing in educational institutions, with deep knowledge of Google's SEO tools and best practices.

  Based on the following information, generate a comprehensive local SEO strategy.
  Your entire response for the 'strategyDocument' field MUST be a single, well-structured markdown document. Do NOT output a JSON object. The output should be ready to be rendered directly as markdown.

  Institution Name: {{{institutionName}}}
  Location: {{{location}}}
  Programs Offered: {{{programsOffered}}}
  Target Audience: {{{targetAudience}}}
  Website URL: {{{websiteUrl}}}

  The markdown strategy document should include the following sections, providing actionable advice:

  ## Executive Summary
  Briefly summarize the proposed local SEO strategy.

  ## Keyword Research & Targeting
  - **Primary Keywords:** Identify 3-5 core local keywords (e.g., "preschool in [City]", "[Institution Type] [Location]"). Suggest using Google Keyword Planner for volume and competition.
  - **Secondary Keywords:** List 5-7 related keywords, including program-specific terms (e.g., "montessori [City]", "coding bootcamp [Location] programs").
  - **Long-Tail Keywords:** Provide 3-5 examples of long-tail keywords that address specific user queries (e.g., "best after-school programs for arts in [Neighborhood]").
  - **Tools:** Mention using Google Trends to understand keyword seasonality and regional interest.

  ## Google My Business (GMB) Optimization
  - **Profile Completeness:** Stress the importance of a 100% complete GMB profile.
  - **NAP Consistency:** Emphasize consistent Name, Address, Phone number across all online mentions.
  - **Categories:** Recommend accurate primary and secondary GMB categories.
  - **Services/Products:** Suggest detailing programs as services/products in GMB.
  - **Photos & Videos:** Advise on uploading high-quality, regular photos and videos.
  - **GMB Posts:** Recommend a strategy for frequent GMB posts (updates, events, offers).
  - **Q&A:** Suggest proactively adding common questions and answers.
  - **Reviews:** Outline strategies for ethically encouraging and responding to reviews.

  ## On-Page Local SEO
  - **Localized Content:** Recommend creating location-specific pages or content (e.g., "Why study at {{{institutionName}}} in [City]").
  - **Title Tags & Meta Descriptions:** Guide on optimizing these with local keywords for key pages.
  - **Header Tags (H1-H6):** Explain how to use headers to structure content with local keywords.
  - **Image Optimization:** Advise on using local keywords in image alt text and filenames.
  - **Local Business Schema:** Strongly recommend implementing LocalBusiness schema markup. Provide an example snippet if possible.

  ## Local Link Building
  - **Local Directories:** Suggest relevant local and niche directories.
  - **Community Partnerships:** Recommend partnerships with local organizations, businesses, or events for backlinks.
  - **Guest Posting:** Suggest guest posting on local blogs or educational sites.
  - **Sponsorships:** Mention local event sponsorships.

  ## Technical Local SEO
  - **Mobile-Friendliness:** Stress the importance of a mobile-friendly website (mention Google's Mobile-Friendly Test).
  - **Site Speed:** Advise on optimizing site speed (mention Google PageSpeed Insights).
  - **Citations & NAP Consistency:** Reiterate checking and correcting NAP consistency across the web.

  ## Tracking & Reporting
  - **Google Analytics:** How to track local traffic and conversions.
  - **Google Search Console:** How to monitor local search performance and indexing.
  - **Key Performance Indicators (KPIs):** Suggest KPIs like local pack rankings, GMB engagement (website clicks, calls, direction requests), and organic traffic from the target location.

  ## Conclusion
  Provide a brief concluding statement.

  Ensure the entire output for 'strategyDocument' is a single, valid markdown string.
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
    if (!output || !output.strategyDocument) {
      // Fallback or error handling if AI fails to generate the document
      return { strategyDocument: "# Error\n\nFailed to generate local SEO strategy. Please try again." };
    }
    return output;
  }
);

