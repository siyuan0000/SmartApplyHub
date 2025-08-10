// Test script for About generation functionality
const { AboutGenerator } = require('../lib/ai/about-generator')

// Sample resume data for testing
const sampleResumeData = {
  contact: {
    name: "John Doe",
    email: "john.doe@example.com",
    phone: "+1 (555) 123-4567",
    location: "San Francisco, CA",
    linkedin: "linkedin.com/in/johndoe",
    github: "github.com/johndoe"
  },
  summary: "",
  experience: [
    {
      title: "Senior Software Engineer",
      company: "Tech Corp Inc.",
      location: "San Francisco, CA",
      startDate: "Jan 2022",
      endDate: "Present",
      current: true,
      description: "Lead development of web applications using React and Node.js",
      achievements: [
        "Increased application performance by 40%",
        "Led a team of 5 developers",
        "Implemented CI/CD pipelines reducing deployment time by 60%"
      ]
    },
    {
      title: "Software Developer",
      company: "Startup Ltd.",
      location: "San Francisco, CA",
      startDate: "Jun 2020",
      endDate: "Dec 2021",
      description: "Developed full-stack applications and APIs",
      achievements: [
        "Built 3 major features from scratch",
        "Reduced API response time by 50%"
      ]
    }
  ],
  education: [
    {
      degree: "Bachelor of Science in Computer Science",
      school: "University of California, Berkeley",
      location: "Berkeley, CA",
      graduationDate: "2020",
      gpa: "3.8"
    }
  ],
  skills: [
    "JavaScript", "React", "Node.js", "Python", "PostgreSQL", 
    "Docker", "AWS", "Git", "Agile", "Team Leadership"
  ],
  projects: [
    {
      name: "E-commerce Platform",
      description: "Full-stack e-commerce application with payment integration",
      details: [
        "Built with React, Node.js, and PostgreSQL",
        "Integrated Stripe payment processing",
        "Deployed on AWS with Docker"
      ],
      technologies: ["React", "Node.js", "PostgreSQL", "Docker", "AWS"],
      url: "https://github.com/johndoe/ecommerce"
    }
  ],
  certifications: [
    "AWS Certified Developer",
    "Scrum Master Certification"
  ]
}

async function testAboutGeneration() {
  console.log('🧪 Testing About Generation System...\n')
  
  try {
    // Test basic about generation
    console.log('1. Testing basic about generation...')
    const result = await AboutGenerator.generateAbout(sampleResumeData)
    
    console.log('✅ About generation successful!')
    console.log('📝 Generated About:')
    console.log('-'.repeat(50))
    console.log(result.aboutText)
    console.log('-'.repeat(50))
    console.log(`📊 Word count: ${result.wordCount}`)
    console.log(`🏷️  Provider: ${result.provider}`)
    console.log(`⏰ Generated at: ${result.generatedAt.toLocaleString()}`)
    
    // Test about variations
    console.log('\n2. Testing about variations...')
    const variations = await AboutGenerator.generateAboutVariations(sampleResumeData, 2)
    
    console.log(`✅ Generated ${variations.length} variations!`)
    variations.forEach((variation, index) => {
      console.log(`\n📝 Variation ${index + 1} (${variation.wordCount} words):`)
      console.log('-'.repeat(30))
      console.log(variation.aboutText)
    })
    
    // Test about enhancement
    if (result.aboutText) {
      console.log('\n3. Testing about enhancement...')
      const enhanced = await AboutGenerator.enhanceExistingAbout(result.aboutText, sampleResumeData)
      
      console.log('✅ About enhancement successful!')
      console.log('📝 Enhanced About:')
      console.log('-'.repeat(50))
      console.log(enhanced.aboutText)
      console.log('-'.repeat(50))
      console.log(`📊 Word count: ${enhanced.wordCount}`)
    }
    
    console.log('\n🎉 All tests completed successfully!')
    
  } catch (error) {
    console.error('❌ About generation test failed:', error.message)
    console.log('\nThis is expected if no valid API keys are configured.')
    console.log('To test the functionality, ensure you have one of these API keys set:')
    console.log('- OPENAI_API_KEY')
    console.log('- DEEPSEEK_API_KEY')
    console.log('- LOCAL_AI_URL (for local models)')
  }
}

// Run the test
testAboutGeneration()