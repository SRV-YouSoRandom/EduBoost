
-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Function to update updated_at column automatically
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Institutions Table
CREATE TABLE IF NOT EXISTS public.institutions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Or ON DELETE CASCADE if institutions should be deleted with user
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    location TEXT NOT NULL,
    programs_offered TEXT NOT NULL,
    target_audience TEXT NOT NULL,
    unique_selling_points TEXT NOT NULL,
    website_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Trigger for institutions updated_at
CREATE TRIGGER handle_updated_at_institutions
    BEFORE UPDATE ON public.institutions
    FOR EACH ROW
    EXECUTE PROCEDURE public.update_updated_at_column();

-- Content Ideas Table
CREATE TABLE IF NOT EXISTS public.content_ideas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    ideas_data JSONB,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    CONSTRAINT unique_content_ideas_institution_id UNIQUE (institution_id)
);

-- Trigger for content_ideas updated_at
CREATE TRIGGER handle_updated_at_content_ideas
    BEFORE UPDATE ON public.content_ideas
    FOR EACH ROW
    EXECUTE PROCEDURE public.update_updated_at_column();

-- GMB Optimizations Table
CREATE TABLE IF NOT EXISTS public.gmb_optimizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    optimization_data JSONB,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    CONSTRAINT unique_gmb_optimizations_institution_id UNIQUE (institution_id)
);

-- Trigger for gmb_optimizations updated_at
CREATE TRIGGER handle_updated_at_gmb_optimizations
    BEFORE UPDATE ON public.gmb_optimizations
    FOR EACH ROW
    EXECUTE PROCEDURE public.update_updated_at_column();


-- Local SEO Strategies Table
CREATE TABLE IF NOT EXISTS public.local_seo_strategies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    strategy_data JSONB,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    CONSTRAINT unique_local_seo_strategies_institution_id UNIQUE (institution_id)
);

-- Trigger for local_seo_strategies updated_at
CREATE TRIGGER handle_updated_at_local_seo_strategies
    BEFORE UPDATE ON public.local_seo_strategies
    FOR EACH ROW
    EXECUTE PROCEDURE public.update_updated_at_column();

-- Performance Marketing Strategies Table
CREATE TABLE IF NOT EXISTS public.performance_marketing_strategies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    strategy_data JSONB, -- Storing the GeneratePerformanceMarketingStrategyOutput which contains markdown & status
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    CONSTRAINT unique_performance_marketing_strategies_institution_id UNIQUE (institution_id)
);

-- Trigger for performance_marketing_strategies updated_at
CREATE TRIGGER handle_updated_at_performance_marketing_strategies
    BEFORE UPDATE ON public.performance_marketing_strategies
    FOR EACH ROW
    EXECUTE PROCEDURE public.update_updated_at_column();

-- ---
-- Row Level Security (RLS) Policies
-- ---
-- IMPORTANT: Enable RLS for each table in the Supabase Dashboard (Authentication > Policies).
-- The policies below assume you have user authentication set up.
-- If you are operating without user authentication for now (e.g. for a demo or single-user mode with anon key),
-- you might need to set up more permissive policies or disable RLS for these tables initially.
-- Example: `CREATE POLICY "Allow anon read access" ON public.institutions FOR SELECT TO anon USING (true);`

-- For Institutions table
ALTER TABLE public.institutions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own institutions"
    ON public.institutions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own institutions"
    ON public.institutions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own institutions"
    ON public.institutions FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own institutions"
    ON public.institutions FOR DELETE
    USING (auth.uid() = user_id);

-- For content_ideas table
ALTER TABLE public.content_ideas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own content ideas"
    ON public.content_ideas FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- For gmb_optimizations table
ALTER TABLE public.gmb_optimizations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own GMB optimizations"
    ON public.gmb_optimizations FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- For local_seo_strategies table
ALTER TABLE public.local_seo_strategies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own local SEO strategies"
    ON public.local_seo_strategies FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- For performance_marketing_strategies table
ALTER TABLE public.performance_marketing_strategies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own performance marketing strategies"
    ON public.performance_marketing_strategies FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- If you are NOT using Supabase Auth yet and just want to test with the ANON key,
-- you might need to grant broader permissions or create policies for the 'anon' role.
-- For example, to allow anonymous users to read all institutions (for testing):
-- CREATE POLICY "Anon users can read all institutions" ON public.institutions FOR SELECT TO anon USING (true);
-- CREATE POLICY "Anon users can insert institutions" ON public.institutions FOR INSERT TO anon WITH CHECK (true);
-- etc. for other tables and operations.
-- BE VERY CAREFUL with such permissive policies in a production environment.
-- The recommended approach is to implement full Supabase Authentication.

-- Grant usage on schema and sequences if necessary, though default public schema grants should be fine.
-- GRANT USAGE ON SCHEMA public TO supabase_admin; -- or your specific roles
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO supabase_admin;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO supabase_admin;

-- Make sure the 'anon' and 'authenticated' roles have SELECT, INSERT, UPDATE, DELETE permissions on these tables
-- This can also be managed in the Supabase Dashboard under Database > Roles.
-- For example:
-- GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.institutions TO anon, authenticated;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.content_ideas TO anon, authenticated;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.gmb_optimizations TO anon, authenticated;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.local_seo_strategies TO anon, authenticated;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.performance_marketing_strategies TO anon, authenticated;

-- Note: The GRANT statements above give broad permissions.
-- RLS policies are the primary mechanism for controlling data access once enabled.
-- If RLS is enabled, these GRANTs allow users to attempt operations,
-- which are then filtered by RLS policies.
-- If RLS is disabled, these GRANTs define who can do what.
-- For development with the anon key, and without auth, you might start with these broad grants and
-- then tighten them with RLS once auth is in place.
