'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AppLayout } from '@/components/layout/AppLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PreferenceDisplay } from '@/components/ui/preference-display'
import { MultiSelectModal } from '@/components/ui/multi-select-modal'
import { User, Bell, Shield, CreditCard, Save, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/types/database.types'

type UserProfile = Database['public']['Tables']['users']['Row']

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


const COMMON_INDUSTRIES = [
  'Technology', 'Healthcare', 'Finance', 'Education', 'E-commerce', 'Gaming', 'SaaS',
  'Consulting', 'Media', 'Non-profit', 'Government', 'Automotive', 'Real Estate', 'Marketing'
]

const SKILLS_CATEGORIES = {
  'Programming Languages': ['JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'Go', 'Rust'],
  'Frontend Frameworks': ['React', 'Vue.js', 'Angular', 'Next.js', 'Svelte'],
  'Backend Technologies': ['Node.js', 'Express.js', 'Django', 'Flask', 'Spring Boot'],
  'Databases': ['PostgreSQL', 'MongoDB', 'MySQL', 'Redis', 'Firebase'],
  'Cloud & DevOps': ['AWS', 'Docker', 'Kubernetes', 'Azure', 'GCP'],
  'Tools & Other': ['Git', 'HTML/CSS', 'GraphQL', 'REST APIs', 'Webpack'],
  'Soft Skills': ['Leadership', 'Communication', 'Problem Solving', 'Team Collaboration', 'Project Management']
}

const ALL_SKILLS = Object.values(SKILLS_CATEGORIES).flat()

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile')
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  // Modal states
  const [jobTitlesModalOpen, setJobTitlesModalOpen] = useState(false)
  const [jobTypesModalOpen, setJobTypesModalOpen] = useState(false)
  const [skillsModalOpen, setSkillsModalOpen] = useState(false)
  const [industriesModalOpen, setIndustriesModalOpen] = useState(false)

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    linkedin: '',
    github: '',
    bio: '',
    job_titles: [] as string[],
    preferred_location: '',
    salary_min: null as number | null,
    salary_max: null as number | null,
    job_type: [] as string[],
    experience_level: '',
    skills: [] as string[],
    industries: [] as string[]
  })

  useEffect(() => {
    loadUserProfile()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const loadUserProfile = async () => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user) {
        router.push('/login')
        return
      }

      const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) {
        console.error('Error loading profile:', error)
        return
      }

      setUserProfile(profile)
      setFormData({
        full_name: profile.full_name || '',
        email: profile.email || '',
        phone: profile.phone || '',
        linkedin: profile.linkedin || '',
        github: profile.github || '',
        bio: profile.bio || '',
        job_titles: profile.job_titles || [],
        preferred_location: profile.preferred_location || '',
        salary_min: profile.salary_min,
        salary_max: profile.salary_max,
        job_type: profile.job_type || [],
        experience_level: profile.experience_level || '',
        skills: profile.skills || [],
        industries: profile.industries || []
      })
    } catch (error) {
      console.error('Failed to load user profile:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const updateFormData = (field: string, value: string | string[] | number | null) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }



  const handleSave = async () => {
    if (!userProfile) return

    setIsSaving(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        throw new Error('No session found')
      }

      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        throw new Error('Failed to update profile')
      }

      const { user: updatedUser } = await response.json()
      setUserProfile(updatedUser)
      
      // Show success message
      alert('Profile updated successfully!')
    } catch (error) {
      console.error('Error updating profile:', error)
      alert('Failed to update profile. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const renderTabContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="ml-2">Loading...</span>
        </div>
      )
    }

    switch (activeTab) {
      case 'profile':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Update your personal information and contact details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Full Name</Label>
                    <Input 
                      id="full_name" 
                      value={formData.full_name}
                      onChange={(e) => updateFormData('full_name', e.target.value)}
                      placeholder="Your full name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      value={formData.email}
                      onChange={(e) => updateFormData('email', e.target.value)}
                      placeholder="your.email@example.com"
                      disabled
                    />
                  </div>
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

                <div className="grid grid-cols-2 gap-4">
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
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea 
                    id="bio" 
                    value={formData.bio}
                    onChange={(e) => updateFormData('bio', e.target.value)}
                    placeholder="Tell us about yourself..."
                    className="min-h-[100px]"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Job Preferences</CardTitle>
                <CardDescription>
                  Your current job search preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Job Titles */}
                <PreferenceDisplay
                  label="Job Titles"
                  items={formData.job_titles}
                  maxVisible={3}
                  onEdit={() => setJobTitlesModalOpen(true)}
                  required
                />

                {/* Experience Level & Location */}
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="experience_level">Experience Level</Label>
                    <Select 
                      value={formData.experience_level}
                      onValueChange={(value) => updateFormData('experience_level', value)}
                    >
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
                      placeholder="San Francisco, CA"
                    />
                  </div>
                </div>

                {/* Salary Range */}
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

                {/* Job Types */}
                <PreferenceDisplay
                  label="Job Types"
                  items={formData.job_type}
                  onEdit={() => setJobTypesModalOpen(true)}
                />

                {/* Skills */}
                <PreferenceDisplay
                  label="Skills"
                  items={formData.skills}
                  maxVisible={6}
                  onEdit={() => setSkillsModalOpen(true)}
                />

                {/* Industries */}
                <PreferenceDisplay
                  label="Industries"
                  items={formData.industries}
                  maxVisible={4}
                  onEdit={() => setIndustriesModalOpen(true)}
                />
              </CardContent>
            </Card>

            {/* Modals */}
            <MultiSelectModal
              open={jobTitlesModalOpen}
              onOpenChange={setJobTitlesModalOpen}
              title="Edit Job Titles"
              description="Select all job titles that interest you"
              options={JOB_TITLES}
              selectedItems={formData.job_titles}
              onSelectionChange={(items) => updateFormData('job_titles', items)}
              onSave={handleSave}
              searchPlaceholder="Search job titles..."
            />

            <MultiSelectModal
              open={jobTypesModalOpen}
              onOpenChange={setJobTypesModalOpen}
              title="Edit Job Types"
              description="Select your preferred job types"
              options={JOB_TYPES}
              selectedItems={formData.job_type}
              onSelectionChange={(items) => updateFormData('job_type', items)}
              onSave={handleSave}
              searchPlaceholder="Search job types..."
            />

            <MultiSelectModal
              open={skillsModalOpen}
              onOpenChange={setSkillsModalOpen}
              title="Edit Skills"
              description="Select your key skills and competencies"
              options={ALL_SKILLS}
              selectedItems={formData.skills}
              onSelectionChange={(items) => updateFormData('skills', items)}
              onSave={handleSave}
              searchPlaceholder="Search skills..."
              categories={SKILLS_CATEGORIES}
            />

            <MultiSelectModal
              open={industriesModalOpen}
              onOpenChange={setIndustriesModalOpen}
              title="Edit Industries"
              description="Select industries that interest you"
              options={COMMON_INDUSTRIES}
              selectedItems={formData.industries}
              onSelectionChange={(items) => updateFormData('industries', items)}
              onSave={handleSave}
              searchPlaceholder="Search industries..."
            />

            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        )

      case 'notifications':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Manage how you receive updates and alerts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Notification settings coming soon...</p>
            </CardContent>
          </Card>
        )

      case 'privacy':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Privacy Settings</CardTitle>
              <CardDescription>
                Control your privacy and data sharing preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Privacy settings coming soon...</p>
            </CardContent>
          </Card>
        )

      case 'billing':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Billing & Subscription</CardTitle>
              <CardDescription>
                Manage your subscription and payment methods
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Billing settings coming soon...</p>
            </CardContent>
          </Card>
        )

      default:
        return null
    }
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account settings and preferences
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="space-y-2">
            <Button 
              variant={activeTab === 'profile' ? 'outline' : 'ghost'} 
              className="w-full justify-start gap-2"
              onClick={() => setActiveTab('profile')}
            >
              <User className="h-4 w-4" />
              Profile
            </Button>
            <Button 
              variant={activeTab === 'notifications' ? 'outline' : 'ghost'} 
              className="w-full justify-start gap-2"
              onClick={() => setActiveTab('notifications')}
            >
              <Bell className="h-4 w-4" />
              Notifications
            </Button>
            <Button 
              variant={activeTab === 'privacy' ? 'outline' : 'ghost'} 
              className="w-full justify-start gap-2"
              onClick={() => setActiveTab('privacy')}
            >
              <Shield className="h-4 w-4" />
              Privacy
            </Button>
            <Button 
              variant={activeTab === 'billing' ? 'outline' : 'ghost'} 
              className="w-full justify-start gap-2"
              onClick={() => setActiveTab('billing')}
            >
              <CreditCard className="h-4 w-4" />
              Billing
            </Button>
          </div>

          <div className="lg:col-span-3">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}