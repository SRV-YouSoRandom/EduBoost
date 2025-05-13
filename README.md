
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

4.  **Set up Supabase Database:**
    *   Go to your Supabase project dashboard.
    *   Navigate to the "SQL Editor" section.
    *   Open the `docs/supabase_setup.sql` file from this project.
    *   Copy the entire content of the SQL file.
    *   Paste it into the Supabase SQL Editor and click "Run". This will create the necessary tables and set up basic structures.
    *   **Row Level Security (RLS):** The SQL script includes commented-out RLS policies. For a production application with user authentication, you should:
        1.  Enable RLS for each table in the Supabase Dashboard (Authentication > Policies for each table).
        2.  Uncomment and adapt the RLS policies in `supabase_setup.sql` to match your authentication setup, ensuring users can only access their own data.
        3.  If you are testing without user authentication (using the `anon` key for all operations), you might need to initially set more permissive RLS policies or temporarily disable RLS for the tables. **This is not recommended for production.**

5.  **Run the Genkit development server (for AI features):**
    In a separate terminal:
    ```bash
    npm run genkit:dev
    ```
    Or for watching changes:
    ```bash
    npm run genkit:watch
    ```
    *Ensure you have your Google AI API key configured for Genkit, typically via `GOOGLE_API_KEY` environment variable or other Genkit configuration methods.*

6.  **Run the Next.js development server:**
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

This application uses Supabase to store all institution data and generated strategies. Each institution you create will have its associated marketing data saved in the Supabase database.
