
-- Enable pg_cron if not already enabled (Supabase does this by default on new projects)
-- CREATE EXTENSION IF NOT EXISTS pg_cron;
-- Enable pgcrypto for gen_random_uuid() if not enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Institutions Table
CREATE TABLE institutions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID, -- Will be linked to auth.users(id) if/when auth is implemented
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    location TEXT NOT NULL,
    programs_offered TEXT NOT NULL,
    target_audience TEXT NOT NULL,
    unique_selling_points TEXT NOT NULL,
    website_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON COLUMN institutions.user_id IS 'Placeholder for user ownership if authentication is added.';

-- Content Ideas Table
CREATE TABLE content_ideas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
    user_id UUID, -- To be linked to auth.users(id) later
    ideas_data JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT content_ideas_institution_id_key UNIQUE (institution_id) -- Ensures one row per institution
);

-- GMB Optimizations Table
CREATE TABLE gmb_optimizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
    user_id UUID,
    optimization_data JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT gmb_optimizations_institution_id_key UNIQUE (institution_id) -- Ensures one row per institution
);

-- Local SEO Strategies Table
CREATE TABLE local_seo_strategies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
    user_id UUID,
    strategy_data JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT local_seo_strategies_institution_id_key UNIQUE (institution_id) -- Ensures one row per institution
);

-- Performance Marketing Strategies Table
CREATE TABLE performance_marketing_strategies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
    user_id UUID,
    strategy_data JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT performance_marketing_strategies_institution_id_key UNIQUE (institution_id) -- Ensures one row per institution
);


-- Function to update 'updated_at' timestamp
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for 'updated_at' on all tables
CREATE TRIGGER set_institutions_timestamp
BEFORE UPDATE ON institutions
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_content_ideas_timestamp
BEFORE UPDATE ON content_ideas
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_gmb_optimizations_timestamp
BEFORE UPDATE ON gmb_optimizations
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_local_seo_strategies_timestamp
BEFORE UPDATE ON local_seo_strategies
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_performance_marketing_strategies_timestamp
BEFORE UPDATE ON performance_marketing_strategies
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();


-- Row Level Security (RLS)
-- Enable RLS for all tables
ALTER TABLE institutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE gmb_optimizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE local_seo_strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_marketing_strategies ENABLE ROW LEVEL SECURITY;

-- Permissive RLS policies for 'anon' role (for initial development without auth)
-- WARNING: These are for development. Replace with user-specific policies for production.

CREATE POLICY "Anon user can perform all operations on institutions"
ON institutions
FOR ALL
TO anon
USING (true)
WITH CHECK (true);

CREATE POLICY "Anon user can perform all operations on content_ideas"
ON content_ideas
FOR ALL
TO anon
USING (true)
WITH CHECK (true);

CREATE POLICY "Anon user can perform all operations on gmb_optimizations"
ON gmb_optimizations
FOR ALL
TO anon
USING (true)
WITH CHECK (true);

CREATE POLICY "Anon user can perform all operations on local_seo_strategies"
ON local_seo_strategies
FOR ALL
TO anon
USING (true)
WITH CHECK (true);

CREATE POLICY "Anon user can perform all operations on performance_marketing_strategies"
ON performance_marketing_strategies
FOR ALL
TO anon
USING (true)
WITH CHECK (true);

/*
-- NOTES FOR PRODUCTION RLS (when user authentication is implemented):
-- Assuming 'user_id' column in each table stores the auth.uid() of the owner.

-- For 'institutions' table:
DROP POLICY IF EXISTS "Anon user can perform all operations on institutions" ON institutions;
DROP POLICY IF EXISTS "Authenticated users can manage their own institutions" ON institutions;

CREATE POLICY "Authenticated users can manage their own institutions"
ON institutions
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- For 'content_ideas' table (and similarly for other strategy tables):
DROP POLICY IF EXISTS "Anon user can perform all operations on content_ideas" ON content_ideas;
DROP POLICY IF EXISTS "Authenticated users can manage their own content ideas" ON content_ideas;

CREATE POLICY "Authenticated users can manage their own content ideas"
ON content_ideas
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Repeat similar policies for gmb_optimizations, local_seo_strategies, performance_marketing_strategies
-- adjusting user_id column as necessary if it's directly on the strategy table or via join to institutions.
-- If strategy tables' user_id is a denormalization of institutions.user_id, the above is fine.
-- If strategy tables should only be accessible if the user owns the PARENT institution, the policy would be:
-- USING (EXISTS (SELECT 1 FROM institutions i WHERE i.id = institution_id AND i.user_id = auth.uid()))
-- WITH CHECK (EXISTS (SELECT 1 FROM institutions i WHERE i.id = institution_id AND i.user_id = auth.uid()));
*/

-- Seed data (Optional - uncomment and modify if needed for development)
/*
INSERT INTO institutions (name, type, location, programs_offered, target_audience, unique_selling_points, website_url) VALUES
('Demo University', 'University', 'Online', 'Computer Science, Business Administration', 'Prospective undergraduate and graduate students', 'Flexible online learning, Industry-relevant curriculum', 'https://example.edu'),
('Little Coders Academy', 'Coding Bootcamp', 'San Francisco, CA', 'Full-Stack Web Development, Data Science', 'Career changers, Aspiring developers', 'Job guarantee, Intensive hands-on projects', 'https://example.com/littlecoders');
*/

SELECT 'Supabase setup script completed successfully.';
SELECT 'IMPORTANT: If you ran a previous version of this script, you might need to drop and recreate the strategy tables (content_ideas, gmb_optimizations, local_seo_strategies, performance_marketing_strategies) or manually add UNIQUE constraints on their institution_id columns for upserts to work correctly.';
