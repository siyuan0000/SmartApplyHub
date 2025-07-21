# Job Data Import Guide

This guide will help you successfully import all your job data from the CSV file into Supabase.

## Prerequisites

1. ✅ Make sure your `.env.local` file contains:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   OPENAI_API_KEY=your_openai_api_key
   ```

2. ✅ Ensure `jobs.csv` file is in the project root directory

## Step-by-Step Import Process

### Step 1: Apply Database Migration

**IMPORTANT: Do this first!**

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and run this SQL command:

```sql
-- Enhance job_postings table for CSV data import
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

-- Update trigger
CREATE TRIGGER IF NOT EXISTS update_job_postings_updated_at 
    BEFORE UPDATE ON public.job_postings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

4. Verify the command runs successfully (no errors)

### Step 2: Run the Import Script

```bash
npm run import-jobs
```

**What to expect:**
- Script will validate your database schema
- Find and process the CSV file
- Import jobs in batches of 50
- Show progress and success/failure rates
- Complete import of 2500+ jobs

**Sample output:**
```
✓ Found CSV file at: /path/to/jobs.csv
🔍 Validating database schema...
✓ Database schema validation passed
Starting CSV import...
📤 Starting batch insert process...
Total jobs to insert: 2547
📋 Processing batch 1/51 (50 jobs)...
✅ Batch 1 completed successfully
📊 Progress: 2.0% (50 inserted, 0 failed)
...
🎉 Import completed!
✅ Successfully imported: 2547 jobs
❌ Failed to import: 0 jobs
📈 Success rate: 100.0%
```

### Step 3: Verify Import Success

```bash
npm run verify-import
```

**This will check:**
- Total number of jobs imported
- Sample job records
- Data distribution (industries, locations, companies)
- Search functionality test

**Sample verification output:**
```
📊 Total jobs in database: 2547
📋 Sample job records:
1. 景林资产研究部招聘实习生
   Company: 上海景林资产管理有限公司
   Location: 上海市/浦东新区
   Industry: 私募基金（创投/私募股权）
...
🏢 Industries represented: 15
📍 Locations represented: 47
🏪 Companies represented: 890
✅ Search test passed. Found 23 results for test query.
📈 Import Assessment:
✅ EXCELLENT: Large dataset successfully imported
🎉 Verification complete!
```

### Step 4: Test Job Search

1. Start your development server: `npm run dev`
2. Navigate to `http://localhost:3000/jobs`
3. You should see all your jobs with working search and filters!

## Troubleshooting

### Common Issues:

**1. "Missing required columns" error**
- ✅ **Solution:** Run the database migration SQL first (Step 1)

**2. "Could not find jobs.csv file"**
- ✅ **Solution:** Make sure `jobs.csv` is in the project root directory

**3. "Missing environment variables"**
- ✅ **Solution:** Check your `.env.local` file has all required variables

**4. "Database connection error"**
- ✅ **Solution:** Verify your Supabase credentials are correct

**5. Partial import (some jobs failed)**
- ✅ **Solution:** Check the console output for specific error messages
- Script will attempt individual inserts for failed batches

### If Import Completely Fails:

1. **Check database permissions:**
   - Ensure your service role key has INSERT permissions
   - Verify Row Level Security policies allow inserts

2. **Try smaller batches:**
   - Edit `scripts/import-jobs.js`
   - Change `batchSize` from 50 to 10

3. **Manual verification:**
   - Go to Supabase dashboard → Table Editor
   - Check if `job_postings` table has the new columns
   - Try inserting a test record manually

## Success Metrics

✅ **Full Success:** 2500+ jobs imported  
✅ **Good Success:** 2000+ jobs imported  
⚠️ **Partial Success:** 500+ jobs imported  
❌ **Failed:** <100 jobs imported  

After successful import, your job search will be fully functional with real Chinese job data!