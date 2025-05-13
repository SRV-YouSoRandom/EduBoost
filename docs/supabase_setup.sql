
-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create institutions table
CREATE TABLE public.institutions (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid, -- Can be linked to auth.users.id if auth is implemented
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    location TEXT NOT NULL,
    programs_offered TEXT NOT NULL,
    target_audience TEXT NOT NULL,
    unique_selling_points TEXT NOT NULL,
    website_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Add comments for institutions table
COMMENT ON TABLE public.institutions IS 'Stores information about educational institutions.';
COMMENT ON COLUMN public.institutions.user_id IS 'Optional link to the user who created/owns this institution.';

-- Create content_ideas table
CREATE TABLE public.content_ideas (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    institution_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
    user_id uuid, -- Optional link to the user
    ideas_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

COMMENT ON TABLE public.content_ideas IS 'Stores AI-generated content ideas for institutions.';
COMMENT ON COLUMN public.content_ideas.ideas_data IS 'JSONB blob containing the generated content ideas and their statuses.';

-- Create gmb_optimizations table
CREATE TABLE public.gmb_optimizations (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    institution_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
    user_id uuid, -- Optional link to the user
    optimization_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

COMMENT ON TABLE public.gmb_optimizations IS 'Stores AI-generated GMB optimization suggestions.';
COMMENT ON COLUMN public.gmb_optimizations.optimization_data IS 'JSONB blob containing GMB keywords, descriptions, and tips.';

-- Create local_seo_strategies table
CREATE TABLE public.local_seo_strategies (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    institution_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
    user_id uuid, -- Optional link to the user
    strategy_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

COMMENT ON TABLE public.local_seo_strategies IS 'Stores AI-generated local SEO strategies.';
COMMENT ON COLUMN public.local_seo_strategies.strategy_data IS 'JSONB blob containing the full local SEO strategy document.';

-- Create performance_marketing_strategies table
CREATE TABLE public.performance_marketing_strategies (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    institution_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
    user_id uuid, -- Optional link to the user
    strategy_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

COMMENT ON TABLE public.performance_marketing_strategies IS 'Stores AI-generated performance marketing strategies.';
COMMENT ON COLUMN public.performance_marketing_strategies.strategy_data IS 'JSONB blob containing the performance marketing strategy document.';

-- Function to update "updated_at" column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to update "updated_at" on table modifications
CREATE TRIGGER update_institutions_updated_at
BEFORE UPDATE ON public.institutions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_content_ideas_updated_at
BEFORE UPDATE ON public.content_ideas
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_gmb_optimizations_updated_at
BEFORE UPDATE ON public.gmb_optimizations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_local_seo_strategies_updated_at
BEFORE UPDATE ON public.local_seo_strategies
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_performance_marketing_strategies_updated_at
BEFORE UPDATE ON public.performance_marketing_strategies
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- ROW LEVEL SECURITY (RLS) POLICIES
-- These are permissive policies for initial development using the anon key.
-- IMPORTANT: For production, these policies MUST be reviewed and tightened,
-- especially when user authentication is fully implemented. They should typically
-- be scoped to `auth.uid() = user_id`.

-- Enable RLS for all tables
ALTER TABLE public.institutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gmb_optimizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.local_seo_strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_marketing_strategies ENABLE ROW LEVEL SECURITY;

-- RLS Policies for 'institutions' table
DROP POLICY IF EXISTS "Allow anon full access to institutions" ON public.institutions;
CREATE POLICY "Allow anon full access to institutions"
ON public.institutions
FOR ALL
TO anon -- Applies to anonymous users
USING (true) -- Allows all rows to be visible/queried
WITH CHECK (true); -- Allows all inserts/updates

-- RLS Policies for 'content_ideas' table
DROP POLICY IF EXISTS "Allow anon full access to content_ideas" ON public.content_ideas;
CREATE POLICY "Allow anon full access to content_ideas"
ON public.content_ideas
FOR ALL
TO anon
USING (true)
WITH CHECK (true);

-- RLS Policies for 'gmb_optimizations' table
DROP POLICY IF EXISTS "Allow anon full access to gmb_optimizations" ON public.gmb_optimizations;
CREATE POLICY "Allow anon full access to gmb_optimizations"
ON public.gmb_optimizations
FOR ALL
TO anon
USING (true)
WITH CHECK (true);

-- RLS Policies for 'local_seo_strategies' table
DROP POLICY IF EXISTS "Allow anon full access to local_seo_strategies" ON public.local_seo_strategies;
CREATE POLICY "Allow anon full access to local_seo_strategies"
ON public.local_seo_strategies
FOR ALL
TO anon
USING (true)
WITH CHECK (true);

-- RLS Policies for 'performance_marketing_strategies' table
DROP POLICY IF EXISTS "Allow anon full access to performance_marketing_strategies" ON public.performance_marketing_strategies;
CREATE POLICY "Allow anon full access to performance_marketing_strategies"
ON public.performance_marketing_strategies
FOR ALL
TO anon
USING (true)
WITH CHECK (true);

-- Note on future RLS with authentication:
-- When user authentication is added, you would typically change policies to something like:
--
-- For SELECT on 'institutions':
-- CREATE POLICY "Users can select their own institutions"
-- ON public.institutions
-- FOR SELECT USING (auth.uid() = user_id);
--
-- For INSERT on 'institutions':
-- CREATE POLICY "Users can insert new institutions for themselves"
-- ON public.institutions
-- FOR INSERT WITH CHECK (auth.uid() = user_id);
--
-- And similarly for UPDATE and DELETE, and for the other strategy tables,
-- ensuring that operations are tied to the authenticated user's ID.
-- The 'anon' role policies would then likely be removed or restricted further.
