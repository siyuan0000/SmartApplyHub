import { createServerComponentClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    console.log('Test API called')
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    
    console.log('Search query:', query)
    
    const supabase = await createServerComponentClient()
    console.log('Supabase client created')
    
    // Simple test query without any complex filters
    const { data: jobs, error } = await supabase
      .from('job_postings')
      .select('id, title, company_name')
      .limit(5)
    
    console.log('Simple query result:', { jobs: jobs?.length, error })
    
    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Database error', details: error }, { status: 500 })
    }
    
    // If simple query works, try with text search
    if (query) {
      console.log('Trying text search...')
      const { data: searchJobs, error: searchError } = await supabase
        .from('job_postings')
        .select('id, title, company_name')
        .ilike('company_name', `%${query}%`)
        .limit(5)
      
      console.log('Search query result:', { jobs: searchJobs?.length, error: searchError })
      
      if (searchError) {
        console.error('Search error:', searchError)
        return NextResponse.json({ error: 'Search error', details: searchError }, { status: 500 })
      }
      
      return NextResponse.json({ message: 'Search successful', jobs: searchJobs })
    }
    
    return NextResponse.json({ message: 'Test successful', jobs })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error', details: error }, { status: 500 })
  }
}