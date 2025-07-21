const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
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

console.log('Environment check:');
console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing');
console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? 'Set' : 'Missing');

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('\n❌ Missing required environment variables!');
  console.error('Please set the following in your .env file:');
  console.error('- NEXT_PUBLIC_SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// CSV file path - check multiple possible locations
const possibleCsvPaths = [
  path.join(__dirname, '..', 'jobs.csv'),
  path.join(process.cwd(), 'jobs.csv'),
  './jobs.csv'
];

function findCsvFile() {
  for (const csvPath of possibleCsvPaths) {
    if (fs.existsSync(csvPath)) {
      console.log(`✓ Found CSV file at: ${csvPath}`);
      return csvPath;
    }
  }
  console.error('❌ Could not find jobs.csv file in any of these locations:');
  possibleCsvPaths.forEach(p => console.error(`   - ${p}`));
  process.exit(1);
}

// CSV column mappings - exact column names from the CSV
const CSV_COLUMNS = {
  SUBMISSION_TIME: '提交时间（自动）',
  ROLE_TYPE: '您是（必填）',
  NAME: '姓名（必填）',
  SCHOOL: '学校（必填）',
  COMPANY: '您所在公司（必填）',
  DEPARTMENT: '您所在部门（必填）',
  JOB_LEVEL: '您的职级（必填）',
  JOB_REQUIREMENTS: '招聘需求（必填）',
  WECHAT_SUPPORT: '投递邮箱之外，是否支持候选人添加您微信（必填）',
  JOB_DESCRIPTION: '招聘信息填写（必填）',
  REMOTE_WORK: '该岗位能否远程工作（必填）',
  WORK_DAYS_PER_WEEK: '该岗位需要每周工作几天（必填）',
  SALARY: '该岗位的薪资待遇（必填）',
  SPECIAL_PREFERENCES: '对候选人有什么特殊偏好（必填）',
  LOCATION: '该岗位所在城市（必填）',
  INDUSTRY: '招聘行业（必填）',
  SUBMITTER: '提交者（自动）'
};

function extractJobTitle(description) {
  // Try to extract job title from the beginning of the description
  if (!description) return '招聘职位';
  
  const lines = description.split('\n');
  const firstLine = lines[0].trim();
  
  // Common patterns for job titles
  if (firstLine.includes('招聘')) {
    return firstLine;
  }
  
  // Look for position keywords
  const positionKeywords = ['实习生', '工程师', '经理', '总监', '专员', '主管', '助理', '分析师'];
  for (const keyword of positionKeywords) {
    if (firstLine.includes(keyword)) {
      return firstLine.length > 50 ? firstLine.substring(0, 50) + '...' : firstLine;
    }
  }
  
  // Default: use first 30 characters
  return firstLine.length > 30 ? firstLine.substring(0, 30) + '...' : firstLine;
}

function parseServiceTypes(requirements) {
  if (!requirements) return [];
  
  const services = [];
  if (requirements.includes('公众号头条发布')) services.push('公众号头条发布');
  if (requirements.includes('公众号任意版面发布')) services.push('公众号任意版面发布');
  if (requirements.includes('社群转发支持')) services.push('社群转发支持');
  if (requirements.includes('精准简历推荐')) services.push('精准简历推荐');
  
  return services;
}

function parseDateFromChinese(dateStr) {
  if (!dateStr) return null;
  
  try {
    // Convert Chinese date format like "2025年5月12日 15:39" to standard format
    const match = dateStr.match(/(\d{4})年(\d{1,2})月(\d{1,2})日\s*(\d{1,2}):(\d{2})/);
    if (match) {
      const [, year, month, day, hour, minute] = match;
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute));
      return date.toISOString();
    }
    
    // Fallback: try direct parsing
    return new Date(dateStr).toISOString();
  } catch (error) {
    console.warn('Could not parse date:', dateStr);
    return null;
  }
}

async function validateDatabaseSchema() {
  console.log('🔍 Validating database schema...');
  
  try {
    // Check if required columns exist
    const { data, error } = await supabase
      .from('job_postings')
      .select('id, title, company_name, location, description, department, industry, remote_work_type, contact_method')
      .limit(1);
    
    if (error) {
      if (error.message.includes('column') && error.message.includes('does not exist')) {
        console.error('❌ Database migration not applied! Missing required columns.');
        console.error('Please run the migration SQL in your Supabase dashboard first.');
        console.error('See apply-migration.md for instructions.');
        process.exit(1);
      }
      throw error;
    }
    
    console.log('✓ Database schema validation passed');
    return true;
  } catch (error) {
    console.error('❌ Database connection or schema error:', error.message);
    process.exit(1);
  }
}

function transformRowToJob(row) {
  const jobDescription = row[CSV_COLUMNS.JOB_DESCRIPTION] || '';
  const jobTitle = extractJobTitle(jobDescription);
  
  return {
    title: jobTitle,
    company_name: row[CSV_COLUMNS.COMPANY] || '',
    location: row[CSV_COLUMNS.LOCATION] || '',
    description: jobDescription,
    requirements: row[CSV_COLUMNS.JOB_REQUIREMENTS] || '',
    salary_range: row[CSV_COLUMNS.SALARY] || '',
    job_type: 'full-time', // Default, could be enhanced based on description
    department: row[CSV_COLUMNS.DEPARTMENT] || '',
    job_level: row[CSV_COLUMNS.JOB_LEVEL] || '',
    industry: row[CSV_COLUMNS.INDUSTRY] || '',
    remote_work_type: row[CSV_COLUMNS.REMOTE_WORK] || '',
    work_days_per_week: row[CSV_COLUMNS.WORK_DAYS_PER_WEEK] || '',
    contact_method: row[CSV_COLUMNS.WECHAT_SUPPORT] || '',
    special_preferences: row[CSV_COLUMNS.SPECIAL_PREFERENCES] || '',
    submitter_name: row[CSV_COLUMNS.SUBMITTER] || '',
    recruiter_type: row[CSV_COLUMNS.ROLE_TYPE] || '',
    service_types: parseServiceTypes(row[CSV_COLUMNS.JOB_REQUIREMENTS]),
    submission_date: parseDateFromChinese(row[CSV_COLUMNS.SUBMISSION_TIME]) || new Date().toISOString()
  };
}

async function importJobsFromCSV() {
  // Validate database schema first
  await validateDatabaseSchema();
  
  // Find the CSV file
  const csvPath = findCsvFile();
  
  const jobs = [];
  let columnNames = [];
  let isFirstRow = true;

  console.log('Starting CSV import...');
  console.log('Expected column mappings:');
  console.log(JSON.stringify(CSV_COLUMNS, null, 2));

  return new Promise((resolve, reject) => {
    fs.createReadStream(csvPath)
      .pipe(csv())
      .on('headers', (headers) => {
        columnNames = headers;
        console.log('\n=== ACTUAL CSV COLUMN NAMES ===');
        headers.forEach((header, index) => {
          console.log(`${index + 1}: "${header}"`);
        });
        console.log('================================\n');
        
        // Verify all expected columns exist
        const missingColumns = [];
        Object.values(CSV_COLUMNS).forEach(expectedCol => {
          if (!headers.includes(expectedCol)) {
            missingColumns.push(expectedCol);
          }
        });
        
        if (missingColumns.length > 0) {
          console.warn('Missing columns:', missingColumns);
        }
      })
      .on('data', (row) => {
        if (isFirstRow) {
          console.log('\n=== SAMPLE ROW DATA ===');
          console.log('First row data:');
          Object.keys(row).forEach(key => {
            console.log(`"${key}": "${row[key]}"`);
          });
          console.log('=====================\n');
          isFirstRow = false;
        }

        try {
          const job = transformRowToJob(row);
          
          // Only add if we have essential data
          if (job.company_name && job.description) {
            jobs.push(job);
            if (jobs.length <= 5) {
              console.log(`✓ Successfully processed job ${jobs.length}:`, {
                title: job.title,
                company: job.company_name,
                location: job.location
              });
            }
          } else {
            console.log('Skipping row with missing essential data:', {
              company: job.company_name,
              hasDescription: !!job.description
            });
          }
        } catch (error) {
          console.error('Error processing row:', error);
          console.log('Problematic row data:', {
            company: row[CSV_COLUMNS.COMPANY],
            description: row[CSV_COLUMNS.JOB_DESCRIPTION]
          });
        }
      })
      .on('end', async () => {
        console.log(`\nParsed ${jobs.length} jobs from CSV`);
        
        if (jobs.length > 0) {
          console.log('\n=== SAMPLE TRANSFORMED JOB ===');
          console.log(JSON.stringify(jobs[0], null, 2));
          console.log('===============================\n');
          
          try {
            // Insert jobs in smaller batches for better reliability
            const batchSize = 50;
            let inserted = 0;
            let failed = 0;
            
            console.log(`\n📤 Starting batch insert process...`);
            console.log(`Total jobs to insert: ${jobs.length}`);
            console.log(`Batch size: ${batchSize}`);
            
            for (let i = 0; i < jobs.length; i += batchSize) {
              const batch = jobs.slice(i, i + batchSize);
              const batchNum = Math.floor(i/batchSize) + 1;
              const totalBatches = Math.ceil(jobs.length/batchSize);
              
              console.log(`\n📋 Processing batch ${batchNum}/${totalBatches} (${batch.length} jobs)...`);
              
              try {
                const { data, error } = await supabase
                  .from('job_postings')
                  .insert(batch);
                
                if (error) {
                  console.error(`❌ Batch ${batchNum} failed:`, error);
                  failed += batch.length;
                  
                  // Try inserting individual records in this batch
                  console.log(`🔄 Attempting individual inserts for batch ${batchNum}...`);
                  for (const job of batch) {
                    try {
                      const { error: singleError } = await supabase
                        .from('job_postings')
                        .insert([job]);
                      
                      if (singleError) {
                        console.error(`❌ Failed to insert job: ${job.title} from ${job.company_name}`);
                        console.error('Error:', singleError.message);
                      } else {
                        inserted++;
                      }
                    } catch (singleJobError) {
                      console.error(`❌ Exception inserting single job:`, singleJobError.message);
                    }
                  }
                } else {
                  inserted += batch.length;
                  console.log(`✅ Batch ${batchNum} completed successfully`);
                }
              } catch (batchError) {
                console.error(`❌ Exception in batch ${batchNum}:`, batchError.message);
                failed += batch.length;
              }
              
              // Progress update
              const progress = ((batchNum / totalBatches) * 100).toFixed(1);
              console.log(`📊 Progress: ${progress}% (${inserted} inserted, ${failed} failed)`);
              
              // Small delay to avoid rate limiting
              if (batchNum < totalBatches) {
                await new Promise(resolve => setTimeout(resolve, 100));
              }
            }
            
            console.log(`\n🎉 Import completed!`);
            console.log(`✅ Successfully imported: ${inserted} jobs`);
            console.log(`❌ Failed to import: ${failed} jobs`);
            console.log(`📈 Success rate: ${((inserted / jobs.length) * 100).toFixed(1)}%`);
            
            resolve(inserted);
          } catch (error) {
            console.error('Error inserting jobs:', error);
            reject(error);
          }
        } else {
          console.log('No valid jobs to import');
          resolve(0);
        }
      })
      .on('error', (error) => {
        console.error('CSV parsing error:', error);
        reject(error);
      });
  });
}

// Run the import
if (require.main === module) {
  importJobsFromCSV()
    .then((count) => {
      console.log(`Import completed: ${count} jobs imported`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('Import failed:', error);
      process.exit(1);
    });
}

module.exports = { importJobsFromCSV };