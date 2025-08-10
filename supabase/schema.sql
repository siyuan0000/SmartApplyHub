-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table (extends auth.users)
CREATE TABLE public.users (
    id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email text NOT NULL,
    full_name text,
    avatar_url text,
    -- Profile information
    phone text,
    linkedin text,
    github text,
    bio text,
    -- Job preferences
    job_titles text[] DEFAULT '{}',
    preferred_location text,
    salary_min integer,
    salary_max integer,
    job_type text[] DEFAULT '{}',
    experience_level text CHECK (experience_level IN ('entry', 'mid', 'senior', 'lead', 'executive')),
    skills text[] DEFAULT '{}',
    industries text[] DEFAULT '{}',
    -- Onboarding tracking
    onboarding_completed boolean DEFAULT false,
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

-- Create email_settings table for user email configuration
CREATE TABLE public.email_settings (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    email_address text NOT NULL,
    email_password text, -- Encrypted password
    smtp_host text DEFAULT 'smtp-mail.outlook.com',
    smtp_port integer DEFAULT 587,
    use_tls boolean DEFAULT true,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(user_id) -- One email config per user
);

-- Create email_logs table to track sent emails
CREATE TABLE public.email_logs (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    job_application_id uuid REFERENCES public.job_applications(id) ON DELETE SET NULL,
    to_email text NOT NULL,
    subject text NOT NULL,
    body text NOT NULL,
    attachments jsonb DEFAULT '[]', -- Array of attachment info
    status text CHECK (status IN ('pending', 'sent', 'failed', 'bounced')) DEFAULT 'pending',
    error_message text,
    sent_at timestamptz,
    created_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_resumes_user_id ON public.resumes(user_id);
CREATE INDEX idx_resumes_is_active ON public.resumes(is_active);
CREATE INDEX idx_job_applications_user_id ON public.job_applications(user_id);
CREATE INDEX idx_job_applications_status ON public.job_applications(status);
CREATE INDEX idx_ai_reviews_user_id ON public.ai_reviews(user_id);
CREATE INDEX idx_ai_reviews_resume_id ON public.ai_reviews(resume_id);
CREATE INDEX idx_application_templates_user_id ON public.application_templates(user_id);
CREATE INDEX idx_email_settings_user_id ON public.email_settings(user_id);
CREATE INDEX idx_email_logs_user_id ON public.email_logs(user_id);
CREATE INDEX idx_email_logs_status ON public.email_logs(status);

-- Row Level Security (RLS) policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

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

-- Email settings policies
CREATE POLICY "Users can view own email settings" ON public.email_settings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own email settings" ON public.email_settings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own email settings" ON public.email_settings
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own email settings" ON public.email_settings
    FOR DELETE USING (auth.uid() = user_id);

-- Email logs policies
CREATE POLICY "Users can view own email logs" ON public.email_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own email logs" ON public.email_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Enable RLS on job_postings and make them public
ALTER TABLE public.job_postings ENABLE ROW LEVEL SECURITY;

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

