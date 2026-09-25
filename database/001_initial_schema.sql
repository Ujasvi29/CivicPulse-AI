-- CivicPulse AI Initial Database Schema Migration
-- Migration 001: Core Entities & Relationships

-- Enable extension for UUID generation if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. UTILITY FUNCTIONS & TRIGGERS
-- ==========================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- 2. TABLE DEFINITIONS
-- ==========================================

-- PROFILES: Application-level user profile (linked to Supabase Auth)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    email TEXT,
    role TEXT DEFAULT 'citizen' CHECK (role IN ('citizen', 'admin')),
    city TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- DEPARTMENTS: Civic departments responsible for resolving cases
CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- REPORTS: Main civic issues reported by citizens
CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_number TEXT UNIQUE NOT NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT,
    subcategory TEXT,
    status TEXT DEFAULT 'submitted' CHECK (
        status IN (
            'submitted',
            'ai_analyzed',
            'assigned',
            'acknowledged',
            'in_progress',
            'resolution_submitted',
            'resolved'
        )
    ),
    severity INTEGER CHECK (severity IS NULL OR (severity >= 0 AND severity <= 100)),
    urgency INTEGER CHECK (urgency IS NULL OR (urgency >= 0 AND urgency <= 100)),
    public_impact INTEGER CHECK (public_impact IS NULL OR (public_impact >= 0 AND public_impact <= 100)),
    duration_days INTEGER DEFAULT 1,
    evidence_confidence INTEGER CHECK (evidence_confidence IS NULL OR (evidence_confidence >= 0 AND evidence_confidence <= 100)),
    impact_score INTEGER CHECK (impact_score IS NULL OR (impact_score >= 0 AND impact_score <= 100)),
    priority TEXT DEFAULT 'moderate' CHECK (priority IN ('critical', 'high', 'moderate', 'low')),
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    address TEXT,
    image_url TEXT,
    recommended_department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

-- AI_ANALYSIS: Structured AI diagnostic details for reports
CREATE TABLE IF NOT EXISTS ai_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID UNIQUE NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
    category TEXT,
    subcategory TEXT,
    summary TEXT,
    severity INTEGER CHECK (severity IS NULL OR (severity >= 0 AND severity <= 100)),
    urgency INTEGER CHECK (urgency IS NULL OR (urgency >= 0 AND urgency <= 100)),
    public_impact INTEGER CHECK (public_impact IS NULL OR (public_impact >= 0 AND public_impact <= 100)),
    evidence_confidence INTEGER CHECK (evidence_confidence IS NULL OR (evidence_confidence >= 0 AND evidence_confidence <= 100)),
    recommended_department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    recommended_action TEXT,
    explanation TEXT,
    raw_response JSONB,
    model_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- REPORT_UPDATES: Timeline tracking for case resolution lifecycle
CREATE TABLE IF NOT EXISTS report_updates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
    status TEXT NOT NULL,
    message TEXT,
    actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 3. AUTOMATIC UPDATED_AT TRIGGERS
-- ==========================================

DROP TRIGGER IF EXISTS trigger_profiles_updated_at ON profiles;
CREATE TRIGGER trigger_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_reports_updated_at ON reports;
CREATE TRIGGER trigger_reports_updated_at
    BEFORE UPDATE ON reports
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_ai_analysis_updated_at ON ai_analysis;
CREATE TRIGGER trigger_ai_analysis_updated_at
    BEFORE UPDATE ON ai_analysis
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- 4. PERFORMANCE INDEXES
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_reports_user_id ON reports(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_priority ON reports(priority);
CREATE INDEX IF NOT EXISTS idx_reports_category ON reports(category);
CREATE INDEX IF NOT EXISTS idx_reports_recommended_department_id ON reports(recommended_department_id);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_lat_lng ON reports(latitude, longitude);

CREATE INDEX IF NOT EXISTS idx_report_updates_report_id ON report_updates(report_id);
CREATE INDEX IF NOT EXISTS idx_ai_analysis_report_id ON ai_analysis(report_id);

-- ==========================================
-- 5. INITIAL SEED DATA
-- ==========================================

INSERT INTO departments (name, description) VALUES
    ('Roads & Infrastructure', 'Handles potholes, road damage, footpaths, bridges, and traffic signals'),
    ('Waste Management', 'Handles garbage accumulation, uncollected waste, illegal dumping, and recycling'),
    ('Water & Drainage', 'Handles pipe leaks, water supply issues, clogged drains, and sewage overflow'),
    ('Electricity & Public Lighting', 'Handles broken streetlights, exposed wiring, transformer failures, and power outages'),
    ('Public Safety', 'Handles public hazards, illegal structures, open manholes, and safety concerns'),
    ('Sanitation', 'Handles public toilets, pest control, cleanliness in public spaces, and hygiene'),
    ('General Civic Services', 'Handles general municipal complaints and uncategorized civic issues')
ON CONFLICT (name) DO NOTHING;

-- ==========================================
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_updates ENABLE ROW LEVEL SECURITY;

-- Departments: Publicly readable by all users
CREATE POLICY "Allow public read access to departments"
    ON departments FOR SELECT
    USING (true);

-- Profiles: Users can read and update their own profile; service role bypasses RLS
CREATE POLICY "Users can view own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
    ON profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Reports: Allow public read of reports (for civic map & public transparency) and authenticated creation
CREATE POLICY "Allow public read access to reports"
    ON reports FOR SELECT
    USING (true);

CREATE POLICY "Allow users to create reports"
    ON reports FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Allow report owner or admin to update reports"
    ON reports FOR UPDATE
    USING (auth.uid() = user_id OR EXISTS (
        SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    ));

-- AI Analysis: Accessible to report viewers
CREATE POLICY "Allow view of AI analysis for reports"
    ON ai_analysis FOR SELECT
    USING (true);

CREATE POLICY "Allow creation of AI analysis"
    ON ai_analysis FOR INSERT
    WITH CHECK (true);

-- Report Updates: Accessible to public viewers, insertable by system/admin
CREATE POLICY "Allow view of report updates"
    ON report_updates FOR SELECT
    USING (true);

CREATE POLICY "Allow insert of report updates"
    ON report_updates FOR INSERT
    WITH CHECK (true);
