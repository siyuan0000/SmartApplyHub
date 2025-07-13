import { supabase } from '@/lib/supabase'

export async function ensureTablesExist(): Promise<void> {
  try {
    // Test if tables exist by querying them
    const { error } = await supabase.from('resumes').select('count', { count: 'exact', head: true })
    
    if (error && error.code === '42P01') {
      // Table doesn't exist, we need to create it
      throw new Error('Database tables not found. Please run the database setup.')
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes('relation') && error.message.includes('does not exist')) {
      throw new Error('Database setup required: Please execute the SQL schema in your Supabase dashboard.')
    }
    throw error
  }
}

export const SETUP_INSTRUCTIONS = `
🔧 Database Setup Required

Your Supabase database needs to be set up. Please follow these steps:

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Navigate to "SQL Editor" in the left sidebar
4. Copy the contents of: supabase/schema.sql
5. Paste it into the SQL Editor
6. Click "Run" to execute

This will create all the necessary tables for your SmartApply project.

Alternative: You can also create the storage bucket:
1. Go to "Storage" in your Supabase dashboard
2. Create a new bucket called "resumes"
3. Set it to public access for file uploads
`