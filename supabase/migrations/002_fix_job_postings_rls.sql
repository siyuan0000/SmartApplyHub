-- Fix RLS policy for job_postings to ensure public access works correctly

-- Enable RLS on job_postings table
ALTER TABLE public.job_postings ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists and recreate it
DROP POLICY IF EXISTS "Job postings are public" ON public.job_postings;

-- Create public read policy for job_postings
CREATE POLICY "Job postings are public" ON public.job_postings
    FOR SELECT USING (true);

-- Ensure no authentication is required for reading job postings
GRANT SELECT ON public.job_postings TO anon, authenticated;