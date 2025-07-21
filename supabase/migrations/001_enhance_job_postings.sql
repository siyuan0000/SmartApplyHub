-- Enhance job_postings table for CSV data import
-- Add columns to match CSV structure

ALTER TABLE public.job_postings 
ADD COLUMN IF NOT EXISTS department text,
ADD COLUMN IF NOT EXISTS job_level text,
ADD COLUMN IF NOT EXISTS industry text,
ADD COLUMN IF NOT EXISTS remote_work_type text,
ADD COLUMN IF NOT EXISTS work_days_per_week text,
ADD COLUMN IF NOT EXISTS contact_email text,
ADD COLUMN IF NOT EXISTS contact_method text,
ADD COLUMN IF NOT EXISTS submitter_name text,
ADD COLUMN IF NOT EXISTS recruiter_type text,
ADD COLUMN IF NOT EXISTS service_types text[],
ADD COLUMN IF NOT EXISTS special_preferences text,
ADD COLUMN IF NOT EXISTS submission_date timestamptz;

-- Add indexes for better search performance
CREATE INDEX IF NOT EXISTS idx_job_postings_industry ON public.job_postings(industry);
CREATE INDEX IF NOT EXISTS idx_job_postings_remote_work ON public.job_postings(remote_work_type);
CREATE INDEX IF NOT EXISTS idx_job_postings_job_level ON public.job_postings(job_level);
CREATE INDEX IF NOT EXISTS idx_job_postings_department ON public.job_postings(department);
CREATE INDEX IF NOT EXISTS idx_job_postings_location_text ON public.job_postings USING gin(to_tsvector('simple', location));
CREATE INDEX IF NOT EXISTS idx_job_postings_title_text ON public.job_postings USING gin(to_tsvector('simple', title));
CREATE INDEX IF NOT EXISTS idx_job_postings_description_text ON public.job_postings USING gin(to_tsvector('simple', description));
CREATE INDEX IF NOT EXISTS idx_job_postings_company_text ON public.job_postings USING gin(to_tsvector('simple', company_name));

-- Update the job_postings table trigger for updated_at
CREATE TRIGGER IF NOT EXISTS update_job_postings_updated_at 
    BEFORE UPDATE ON public.job_postings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();