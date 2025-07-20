# Smart Apply

An AI-powered job application platform that helps users optimize their resumes, find relevant jobs, and track their application progress.

## Features

- 🤖 **AI Resume Optimization** - Get intelligent suggestions to improve your resume
- 🎯 **Smart Job Matching** - Find jobs that match your skills and preferences
- 📊 **Application Tracking** - Monitor your job applications with detailed analytics
- 📝 **Cover Letter Generation** - Create personalized cover letters with AI
- 🔍 **ATS Analysis** - Ensure your resume passes Applicant Tracking Systems
- 📈 **Performance Insights** - Track your job search success metrics

## Tech Stack

### Frontend

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety and better development experience
- **Tailwind CSS** - Utility-first CSS framework
- **Shadcn/UI** - Modern component library
- **Zustand** - Lightweight state management
- **React Query** - Data fetching and caching

### Backend

- **Supabase** - PostgreSQL database with real-time features
- **Supabase Auth** - Authentication and user management
- **Row Level Security** - Database-level security policies
- **Supabase Edge Functions** - Serverless functions for AI processing

### AI Integration

- **OpenAI API** - Resume analysis and optimization
- **GPT-4** - Natural language processing for content generation

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account
- OpenAI API key (optional for AI features)

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd ai_resume
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env.local
   ```

   Update `.env.local` with your actual values:

   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   OPENAI_API_KEY=your_openai_api_key
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

4. **Set up Supabase**

   - Create a new Supabase project
   - Run the SQL schema: `supabase/schema.sql`
   - Enable authentication providers (Google, GitHub, etc.)

5. **Run the development server**

   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

```
ai_resume/
├── app/                    # Next.js app router pages
│   ├── dashboard/         # Dashboard page
│   ├── resumes/          # Resume management
│   ├── applications/     # Job application tracking
│   ├── jobs/             # Job search
│   ├── ai-review/        # AI-powered resume review
│   ├── templates/        # Cover letter templates
│   └── settings/         # User settings
├── components/           # Reusable UI components
│   ├── ui/              # Shadcn/UI components
│   ├── layout/          # Layout components
│   └── providers/       # Context providers
├── lib/                 # Utility functions
├── hooks/              # Custom React hooks
├── store/              # Zustand stores
├── types/              # TypeScript type definitions
└── supabase/           # Database schema and migrations
```

## Key Features Implementation

### Authentication

- Supabase Auth with Google/GitHub OAuth
- Row Level Security for data protection
- Automatic user profile creation

### Dashboard

- Application statistics and analytics
- Recent activity tracking
- AI-powered insights and recommendations
- Quick action shortcuts

### Resume Management

- File upload and storage
- Version control
- AI optimization scoring
- ATS compatibility analysis

### Job Application Tracking

- Application status management
- Company and position details
- Notes and follow-up tracking
- Response rate analytics

## Database Schema

The application uses PostgreSQL with the following main tables:

- `users` - User profiles and settings
- `resumes` - Resume storage and versioning
- `job_postings` - Job listings and details
- `job_applications` - Application tracking
- `ai_reviews` - AI analysis results
- `application_templates` - Cover letter templates

## Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Manual Deployment

1. Build the application: `npm run build`
2. Deploy the `.next` folder to your hosting provider
3. Set up environment variables on your hosting platform

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request
