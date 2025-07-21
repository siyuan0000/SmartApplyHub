-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table (extends auth.users)
CREATE TABLE public.users (
    id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email text NOT NULL,
    full_name text,
    avatar_url text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create resumes table
CREATE TABLE public.resumes (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    title text NOT NULL,
    content jsonb NOT NULL,
    file_url text,
    language text CHECK (language IN ('en', 'zh', 'auto')) DEFAULT 'auto',
    detected_language text CHECK (detected_language IN ('en', 'zh')),
    original_headers jsonb,
    job_roles text[] DEFAULT '{}',
    industries text[] DEFAULT '{}',
    optimization_tags jsonb DEFAULT '{}',
    target_roles text[] DEFAULT '{}',
    applied_to text[] DEFAULT '{}',
    version integer DEFAULT 1,
    is_active boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create job_postings table
CREATE TABLE public.job_postings (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    title text NOT NULL,
    company_name text NOT NULL,
    location text NOT NULL,
    description text NOT NULL,
    requirements text,
    salary_range text,
    job_type text CHECK (job_type IN ('full-time', 'part-time', 'contract', 'internship')) DEFAULT 'full-time',
    source_url text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create job_applications table
CREATE TABLE public.job_applications (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    job_posting_id uuid REFERENCES public.job_postings(id) ON DELETE SET NULL,
    company_name text NOT NULL,
    position_title text NOT NULL,
    status text CHECK (status IN ('pending', 'applied', 'interview', 'offer', 'rejected')) DEFAULT 'pending',
    applied_at timestamptz,
    notes text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create ai_reviews table
CREATE TABLE public.ai_reviews (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    resume_id uuid REFERENCES public.resumes(id) ON DELETE CASCADE NOT NULL,
    review_type text CHECK (review_type IN ('optimization', 'ats_analysis', 'skill_gap')) NOT NULL,
    feedback jsonb NOT NULL,
    score integer CHECK (score >= 0 AND score <= 100),
    created_at timestamptz DEFAULT now()
);

-- Create application_templates table
CREATE TABLE public.application_templates (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    name text NOT NULL,
    subject text NOT NULL,
    content text NOT NULL,
    is_default boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_resumes_user_id ON public.resumes(user_id);
CREATE INDEX idx_resumes_is_active ON public.resumes(is_active);
CREATE INDEX idx_job_applications_user_id ON public.job_applications(user_id);
CREATE INDEX idx_job_applications_status ON public.job_applications(status);
CREATE INDEX idx_ai_reviews_user_id ON public.ai_reviews(user_id);
CREATE INDEX idx_ai_reviews_resume_id ON public.ai_reviews(resume_id);
CREATE INDEX idx_application_templates_user_id ON public.application_templates(user_id);

-- Row Level Security (RLS) policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_templates ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Resumes policies
CREATE POLICY "Users can view own resumes" ON public.resumes
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own resumes" ON public.resumes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own resumes" ON public.resumes
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own resumes" ON public.resumes
    FOR DELETE USING (auth.uid() = user_id);

-- Job applications policies
CREATE POLICY "Users can view own applications" ON public.job_applications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own applications" ON public.job_applications
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own applications" ON public.job_applications
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own applications" ON public.job_applications
    FOR DELETE USING (auth.uid() = user_id);

-- AI reviews policies
CREATE POLICY "Users can view own ai reviews" ON public.ai_reviews
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own ai reviews" ON public.ai_reviews
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Application templates policies
CREATE POLICY "Users can view own templates" ON public.application_templates
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own templates" ON public.application_templates
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own templates" ON public.application_templates
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own templates" ON public.application_templates
    FOR DELETE USING (auth.uid() = user_id);

-- Job postings are public (everyone can read)
CREATE POLICY "Job postings are public" ON public.job_postings
    FOR SELECT USING (true);

-- Functions for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_resumes_updated_at BEFORE UPDATE ON public.resumes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_job_applications_updated_at BEFORE UPDATE ON public.job_applications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_application_templates_updated_at BEFORE UPDATE ON public.application_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to handle user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$ language 'plpgsql' security definer;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

