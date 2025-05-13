# EduBoost - AI Digital Marketing Assistant

This is a Next.js application designed to assist educational institutions with their digital marketing efforts using AI-powered tools.

## Getting Started

1.  **Clone the repository.**
2.  **Install dependencies:**
    ```bash
    npm install
    # or
    yarn install
    # or
    pnpm install
    ```
3.  **Set up environment variables:**
    Create a `.env` file in the root of your project and add your Supabase credentials:
    ```env
    NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_URL
    NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
    ```
    Replace `YOUR_SUPABASE_URL` and `YOUR_SUPABASE_ANON_KEY` with the actual values from your Supabase project settings (Project Settings > API).

4.  **Set up Supabase Database (CRITICAL STEP):**
    *   Go to your Supabase project dashboard.
    *   Navigate to the "SQL Editor" section.
    *   Open the `docs/supabase_setup.sql` file from this project.
    *   **Copy the entire content of the SQL file.**
    *   Paste it into the Supabase SQL Editor and click "Run". This will:
        *   Create the necessary tables: `institutions`, `content_ideas`, `gmb_optimizations`, `local_seo_strategies`, and `performance_marketing_strategies`.
        *   Set up foreign key relationships with cascade delete (e.g., deleting an institution will also delete its associated strategies).
        *   Create a function and triggers to automatically update `updated_at` timestamps.
        *   Enable Row Level Security (RLS) on all created tables.
        *   Apply permissive RLS policies for the `anon` role, allowing full CRUD access. **These policies are intended for initial development and must be tightened when user authentication is implemented.**
    *   **Troubleshooting Supabase Errors (like `Error: {}`):**
        *   **Ensure the `supabase_setup.sql` script has been run successfully in your Supabase project.** This is the most common cause of empty error objects or inability to fetch/save data. If the tables or RLS policies are missing or incorrect, the application will not function.
        *   Verify your `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in the `.env` file are correct and match your Supabase project.
        *   Check your browser's developer console for more detailed error messages that might have been logged.

5.  **Understanding Row Level Security (RLS):**
    *   The `supabase_setup.sql` script enables RLS and sets up initial permissive policies for development purposes (allowing anonymous users full access). This is crucial for the application to function correctly with the `anon` key before full user authentication is in place.
    *   **For Production:** When you implement user authentication, you **MUST** replace these permissive `anon` policies with stricter policies that scope data access to the authenticated user (e.g., `auth.uid() = user_id`). Examples and notes for this are included as comments at the end of the `supabase_setup.sql` script.

6.  **Run the Genkit development server (for AI features):**
    In a separate terminal:
    ```bash
    npm run genkit:dev
    ```
    Or for watching changes:
    ```bash
    npm run genkit:watch
    ```
    *Ensure you have your Google AI API key configured for Genkit, typically via `GOOGLE_API_KEY` environment variable or other Genkit configuration methods.*

7.  **Run the Next.js development server:**
    ```bash
    npm run dev
    ```
    The application should now be running, typically at `http://localhost:9002`.

## Core Features

*   **AI-Powered Local SEO:** Generate local SEO strategies.
*   **GMB Optimizer:** Provide recommendations for Google My Business optimization.
*   **Performance Marketing Strategy Generator:** Generate performance marketing strategy documents.
*   **AI Content Idea Generator:** Create content ideas relevant to educational institutions.
*   **Institution Management:** Create, update, and delete institution profiles to store and manage data for.

## Data Persistence

This application uses Supabase to store all institution data and generated strategies. Each institution you create will have its associated marketing data saved in the Supabase database. The relationships are set up with cascade delete, meaning if an institution is deleted, all its related strategy data will also be removed.
