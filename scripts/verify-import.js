const { createClient } = require('@supabase/supabase-js');

// Try to load dotenv if available
try {
  require('dotenv').config({ path: '.env.local' });
} catch (error) {
  console.log('dotenv not found, using environment variables directly');
}

// Check for required environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables!');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifyImport() {
  console.log('🔍 Verifying job import...\n');
  
  try {
    // 1. Check total count
    const { count: totalJobs, error: countError } = await supabase
      .from('job_postings')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('❌ Error counting jobs:', countError);
      return;
    }
    
    console.log(`📊 Total jobs in database: ${totalJobs}`);
    
    if (totalJobs === 0) {
      console.log('❌ No jobs found in database. Import may have failed.');
      console.log('💡 Try running: npm run import-jobs');
      return;
    }
    
    // 2. Sample some records
    const { data: sampleJobs, error: sampleError } = await supabase
      .from('job_postings')
      .select('*')
      .limit(3);
    
    if (sampleError) {
      console.error('❌ Error fetching sample jobs:', sampleError);
      return;
    }
    
    console.log('\n📋 Sample job records:');
    sampleJobs.forEach((job, index) => {
      console.log(`\n${index + 1}. ${job.title}`);
      console.log(`   Company: ${job.company_name}`);
      console.log(`   Location: ${job.location}`);
      console.log(`   Industry: ${job.industry || 'Not specified'}`);
      console.log(`   Remote: ${job.remote_work_type || 'Not specified'}`);
      console.log(`   Created: ${new Date(job.created_at).toLocaleString()}`);
    });
    
    // 3. Check data distribution
    const { data: industries, error: industryError } = await supabase
      .from('job_postings')
      .select('industry')
      .not('industry', 'is', null)
      .not('industry', 'eq', '');
    
    const { data: locations, error: locationError } = await supabase
      .from('job_postings')
      .select('location')
      .not('location', 'is', null)
      .not('location', 'eq', '');
    
    const { data: companies, error: companyError } = await supabase
      .from('job_postings')
      .select('company_name')
      .not('company_name', 'is', null)
      .not('company_name', 'eq', '');
    
    if (!industryError && industries) {
      const uniqueIndustries = new Set(industries.map(i => i.industry));
      console.log(`\n🏢 Industries represented: ${uniqueIndustries.size}`);
      console.log('Top industries:', Array.from(uniqueIndustries).slice(0, 5).join(', '));
    }
    
    if (!locationError && locations) {
      const uniqueLocations = new Set(locations.map(l => l.location));
      console.log(`\n📍 Locations represented: ${uniqueLocations.size}`);
      console.log('Top locations:', Array.from(uniqueLocations).slice(0, 5).join(', '));
    }
    
    if (!companyError && companies) {
      const uniqueCompanies = new Set(companies.map(c => c.company_name));
      console.log(`\n🏪 Companies represented: ${uniqueCompanies.size}`);
    }
    
    // 4. Test search functionality
    console.log('\n🔍 Testing search functionality...');
    
    const { data: searchResults, error: searchError } = await supabase
      .from('job_postings')
      .select('title, company_name, location')
      .or('title.ilike.%实习%,company_name.ilike.%字节%,description.ilike.%投资%')
      .limit(3);
    
    if (searchError) {
      console.error('❌ Search test failed:', searchError);
    } else {
      console.log(`✅ Search test passed. Found ${searchResults.length} results for test query.`);
      if (searchResults.length > 0) {
        console.log('Sample search results:');
        searchResults.forEach((job, index) => {
          console.log(`   ${index + 1}. ${job.title} at ${job.company_name}`);
        });
      }
    }
    
    // 5. Overall assessment
    console.log('\n📈 Import Assessment:');
    if (totalJobs > 2000) {
      console.log('✅ EXCELLENT: Large dataset successfully imported');
    } else if (totalJobs > 500) {
      console.log('✅ GOOD: Substantial dataset imported');
    } else if (totalJobs > 100) {
      console.log('⚠️  PARTIAL: Some data imported, may need investigation');
    } else {
      console.log('❌ POOR: Very few records imported, likely import issues');
    }
    
    console.log('\n🎉 Verification complete!');
    console.log('💡 You can now test the job search at /jobs');
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
  }
}

// Run verification
if (require.main === module) {
  verifyImport()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('Verification failed:', error);
      process.exit(1);
    });
}

module.exports = { verifyImport };