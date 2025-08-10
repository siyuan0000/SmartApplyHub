'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Brain, User, Briefcase, Target, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SelectableTag } from '@/components/ui/selectable-tag'
import { Badge } from '@/components/ui/badge'

const EXPERIENCE_LEVELS = [
  { value: 'entry', label: 'Entry Level (0-2 years)' },
  { value: 'mid', label: 'Mid Level (3-5 years)' },
  { value: 'senior', label: 'Senior Level (6-10 years)' },
  { value: 'lead', label: 'Lead/Manager (10+ years)' },
  { value: 'executive', label: 'Executive/C-Level' }
]

const JOB_TITLES = [
  'Software Engineer', 'Senior Software Engineer', 'Frontend Engineer', 'Backend Engineer', 'Full Stack Engineer',
  'Product Manager', 'Senior Product Manager', 'Principal Product Manager',
  'UX Designer', 'UI Designer', 'Product Designer', 'UX Researcher',
  'Data Scientist', 'Data Analyst', 'Data Engineer', 'Machine Learning Engineer',
  'DevOps Engineer', 'Cloud Engineer', 'Site Reliability Engineer',
  'Marketing Manager', 'Digital Marketing Manager', 'Content Marketing Manager',
  'Sales Manager', 'Account Executive', 'Business Development Manager',
  'Project Manager', 'Program Manager', 'Scrum Master',
  'Business Analyst', 'Financial Analyst', 'Operations Manager'
]

const JOB_TYPES = ['Full-time', 'Part-time', 'Contract', 'Freelance', 'Internship', 'Remote']

const COMMON_SKILLS = [
  'JavaScript', 'TypeScript', 'React', 'Node.js', 'Python', 'Java', 'C++', 'SQL', 'AWS', 'Docker',
  'Git', 'HTML/CSS', 'MongoDB', 'PostgreSQL', 'Express.js', 'Next.js', 'Vue.js', 'Angular',
  'Project Management', 'Leadership', 'Communication', 'Problem Solving', 'Team Collaboration'
]

const COMMON_INDUSTRIES = [
  'Technology', 'Healthcare', 'Finance', 'Education', 'E-commerce', 'Gaming', 'SaaS',
  'Consulting', 'Media', 'Non-profit', 'Government', 'Automotive', 'Real Estate', 'Marketing'
]

interface OnboardingData {
  // Profile info
  full_name: string
  phone: string
  linkedin: string
  github: string
  bio: string
  // Job preferences
  job_titles: string[]
  preferred_location: string
  salary_min: number | null
  salary_max: number | null
  job_type: string[]
  experience_level: string
  skills: string[]
  industries: string[]
}

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [user, setUser] = useState<{ id: string } | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const [formData, setFormData] = useState<OnboardingData>({
    full_name: '',
    phone: '',
    linkedin: '',
    github: '',
    bio: '',
    job_titles: [],
    preferred_location: '',
    salary_min: null,
    salary_max: null,
    job_type: [],
    experience_level: '',
    skills: [],
    industries: []
  })

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUser(user)
      
      // Pre-populate with existing data if available
      if (user.user_metadata?.full_name) {
        setFormData(prev => ({
          ...prev,
          full_name: user.user_metadata.full_name || ''
        }))
      }
    }
    checkUser()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const updateFormData = (field: keyof OnboardingData, value: string | string[] | number | null) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const toggleArrayField = (field: 'job_titles' | 'job_type' | 'skills' | 'industries', value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(value) 
        ? prev[field].filter(item => item !== value)
        : [...prev[field], value]
    }))
  }



  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleComplete = async () => {
    if (!user) return

    setIsLoading(true)
    try {
      // Update user profile with all onboarding data
      const { error } = await supabase
        .from('users')
        .update({
          ...formData,
          onboarding_completed: true
        })
        .eq('id', user.id)

      if (error) throw error

      // Redirect to dashboard
      router.push('/dashboard')
    } catch (error) {
      console.error('Error completing onboarding:', error)
      alert('Failed to save your information. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return formData.full_name.trim() !== ''
      case 2:
        return formData.job_titles.length > 0 && formData.experience_level !== ''
      case 3:
        return formData.skills.length > 0
      default:
        return true
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <User className="h-16 w-16 mx-auto mb-4 text-primary" />
              <h2 className="text-2xl font-bold">Welcome! Let&apos;s get to know you</h2>
              <p className="text-muted-foreground">Tell us a bit about yourself</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name *</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => updateFormData('full_name', e.target.value)}
                  placeholder="Your full name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => updateFormData('phone', e.target.value)}
                  placeholder="(555) 123-4567"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="linkedin">LinkedIn Profile</Label>
                <Input
                  id="linkedin"
                  value={formData.linkedin}
                  onChange={(e) => updateFormData('linkedin', e.target.value)}
                  placeholder="https://linkedin.com/in/yourname"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="github">GitHub Profile</Label>
                <Input
                  id="github"
                  value={formData.github}
                  onChange={(e) => updateFormData('github', e.target.value)}
                  placeholder="https://github.com/yourusername"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => updateFormData('bio', e.target.value)}
                  placeholder="Tell us about yourself, your background, and what you're passionate about..."
                  className="min-h-[100px]"
                />
              </div>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Briefcase className="h-16 w-16 mx-auto mb-4 text-primary" />
              <h2 className="text-2xl font-bold">Your Job Preferences</h2>
              <p className="text-muted-foreground">Help us find the perfect opportunities for you</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-3">
                <Label>Job Titles * (select all that interest you)</Label>
                <div className="flex flex-wrap gap-2">
                  {JOB_TITLES.map(title => (
                    <SelectableTag
                      key={title}
                      label={title}
                      selected={formData.job_titles.includes(title)}
                      onClick={() => toggleArrayField('job_titles', title)}
                    />
                  ))}
                </div>
                {formData.job_titles.length > 0 && (
                  <div className="text-sm text-muted-foreground">
                    Selected: {formData.job_titles.length} title{formData.job_titles.length > 1 ? 's' : ''}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="experience_level">Experience Level *</Label>
                <Select onValueChange={(value) => updateFormData('experience_level', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your experience level" />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPERIENCE_LEVELS.map(level => (
                      <SelectItem key={level.value} value={level.value}>
                        {level.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="preferred_location">Preferred Location</Label>
                <Input
                  id="preferred_location"
                  value={formData.preferred_location}
                  onChange={(e) => updateFormData('preferred_location', e.target.value)}
                  placeholder="e.g. San Francisco, CA or Remote"
                />
              </div>

              <div className="space-y-2">
                <Label>Salary Range (USD)</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="salary_min" className="text-sm text-muted-foreground">Minimum</Label>
                    <Input
                      id="salary_min"
                      type="number"
                      value={formData.salary_min || ''}
                      onChange={(e) => updateFormData('salary_min', e.target.value ? parseInt(e.target.value) : null)}
                      placeholder="80,000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="salary_max" className="text-sm text-muted-foreground">Maximum</Label>
                    <Input
                      id="salary_max"
                      type="number"
                      value={formData.salary_max || ''}
                      onChange={(e) => updateFormData('salary_max', e.target.value ? parseInt(e.target.value) : null)}
                      placeholder="120,000"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Label>Job Types (select all that apply)</Label>
                <div className="flex flex-wrap gap-2">
                  {JOB_TYPES.map(type => (
                    <SelectableTag
                      key={type}
                      label={type}
                      selected={formData.job_type.includes(type)}
                      onClick={() => toggleArrayField('job_type', type)}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Target className="h-16 w-16 mx-auto mb-4 text-primary" />
              <h2 className="text-2xl font-bold">Skills & Industries</h2>
              <p className="text-muted-foreground">What are your key skills and preferred industries?</p>
            </div>

            <div className="space-y-6">
              <div className="space-y-3">
                <Label>Skills *</Label>
                <p className="text-sm text-muted-foreground">Select your key skills</p>
                <div className="flex flex-wrap gap-2">
                  {COMMON_SKILLS.map(skill => (
                    <SelectableTag
                      key={skill}
                      label={skill}
                      selected={formData.skills.includes(skill)}
                      onClick={() => toggleArrayField('skills', skill)}
                    />
                  ))}
                </div>
                {formData.skills.length > 0 && (
                  <div className="text-sm text-muted-foreground">
                    Selected: {formData.skills.length} skill{formData.skills.length > 1 ? 's' : ''}
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <Label>Industries</Label>
                <p className="text-sm text-muted-foreground">Which industries interest you?</p>
                <div className="flex flex-wrap gap-2">
                  {COMMON_INDUSTRIES.map(industry => (
                    <SelectableTag
                      key={industry}
                      label={industry}
                      selected={formData.industries.includes(industry)}
                      onClick={() => toggleArrayField('industries', industry)}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <CheckCircle className="h-16 w-16 mx-auto mb-4 text-green-500" />
              <h2 className="text-2xl font-bold">You&apos;re All Set!</h2>
              <p className="text-muted-foreground">Review your information and start your AI-powered job search</p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Your Profile Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium">Personal Info</h4>
                  <p className="text-sm text-muted-foreground">Name: {formData.full_name}</p>
                  {formData.phone && <p className="text-sm text-muted-foreground">Phone: {formData.phone}</p>}
                </div>

                <div>
                  <h4 className="font-medium">Job Preferences</h4>
                  <p className="text-sm text-muted-foreground">Roles: {formData.job_titles.join(', ')}</p>
                  <p className="text-sm text-muted-foreground">Level: {EXPERIENCE_LEVELS.find(l => l.value === formData.experience_level)?.label}</p>
                  {formData.preferred_location && <p className="text-sm text-muted-foreground">Location: {formData.preferred_location}</p>}
                  {(formData.salary_min || formData.salary_max) && (
                    <p className="text-sm text-muted-foreground">
                      Salary: {formData.salary_min ? `$${formData.salary_min.toLocaleString()}` : 'Any'} - {formData.salary_max ? `$${formData.salary_max.toLocaleString()}` : 'Any'}
                    </p>
                  )}
                </div>

                <div>
                  <h4 className="font-medium">Skills</h4>
                  <div className="flex flex-wrap gap-1">
                    {formData.skills.slice(0, 8).map(skill => (
                      <Badge key={skill} variant="outline" className="text-xs">{skill}</Badge>
                    ))}
                    {formData.skills.length > 8 && (
                      <Badge variant="outline" className="text-xs">+{formData.skills.length - 8} more</Badge>
                    )}
                  </div>
                </div>

                {formData.industries.length > 0 && (
                  <div>
                    <h4 className="font-medium">Industries</h4>
                    <p className="text-sm text-muted-foreground">{formData.industries.join(', ')}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )

      default:
        return null
    }
  }

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-2xl mx-auto py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Brain className="h-6 w-6" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">AI Resume Pro Setup</h1>
          <p className="text-gray-600">Step {currentStep} of 4</p>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-8">
          <div 
            className="bg-primary h-2 rounded-full transition-all duration-300" 
            style={{ width: `${(currentStep / 4) * 100}%` }}
          />
        </div>

        {/* Content */}
        <Card className="mb-8">
          <CardContent className="p-8">
            {renderStep()}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={handlePrev}
            disabled={currentStep === 1}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>

          {currentStep < 4 ? (
            <Button 
              onClick={handleNext}
              disabled={!isStepValid()}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button 
              onClick={handleComplete}
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : 'Complete Setup'}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}