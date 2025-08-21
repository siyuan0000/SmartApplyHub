'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Copy, CheckCircle } from 'lucide-react'
import { ResumeContent } from '@/lib/resume/parser'
import { useToast } from '@/hooks/use-toast'

interface EnhancedContentDisplayProps {
  sectionType: string
  enhancedContent: string
  onApplyField: (fieldPath: string, value: string) => void
  originalContent?: ResumeContent | null
}

interface ParsedExperience {
  title: string
  company: string
  startDate: string
  endDate: string
  location: string
  description: string
  achievements: string[]
}

interface ParsedEducation {
  degree: string
  school: string
  graduationDate: string
  gpa: string
  location: string
  honors: string[]
}

interface ParsedProject {
  name: string
  description: string
  technologies: string[]
  details: string[]
  url: string
  startDate: string
  endDate: string
}

interface ParsedContact {
  name: string
  email: string
  phone: string
  location: string
  linkedin: string
  github: string
  website: string
}

export function EnhancedContentDisplay({
  sectionType,
  enhancedContent,
  onApplyField
}: EnhancedContentDisplayProps) {
  const { toast } = useToast()
  const [appliedFields, setAppliedFields] = useState<Set<string>>(new Set())

  const handleApplyField = (fieldPath: string, value: string) => {
    onApplyField(fieldPath, value)
    setAppliedFields(prev => new Set([...prev, fieldPath]))
    toast({
      title: "Field Applied",
      description: `Updated ${fieldPath.split('.').pop()} successfully`,
    })
  }

  const parseEnhancedContent = () => {
    if (!enhancedContent) return null

    const lines = enhancedContent.split('\n').filter(line => line.trim())
    
    switch (sectionType) {
      case 'contact':
        return parseContactContent(lines)
      case 'summary':
        return enhancedContent.trim()
      case 'experience':
        return parseExperienceContent(lines)
      case 'education':
        return parseEducationContent(lines)
      case 'skills':
        return parseSkillsContent(lines)
      case 'projects':
        return parseProjectsContent(lines)
      default:
        return enhancedContent
    }
  }

  const parseContactContent = (lines: string[]): ParsedContact => {
    const contact: ParsedContact = {
      name: '',
      email: '',
      phone: '',
      location: '',
      linkedin: '',
      github: '',
      website: ''
    }

    lines.forEach(line => {
      const [field, ...valueParts] = line.split(':')
      const value = valueParts.join(':').trim()
      
      const fieldLower = field.toLowerCase().trim()
      if (fieldLower.includes('name')) contact.name = value
      else if (fieldLower.includes('email')) contact.email = value
      else if (fieldLower.includes('phone')) contact.phone = value
      else if (fieldLower.includes('location')) contact.location = value
      else if (fieldLower.includes('linkedin')) contact.linkedin = value
      else if (fieldLower.includes('github')) contact.github = value
      else if (fieldLower.includes('website')) contact.website = value
    })

    return contact
  }

  const parseExperienceContent = (lines: string[]): ParsedExperience[] => {
    const experiences: ParsedExperience[] = []
    const currentExp: Partial<ParsedExperience> = {}
    const currentAchievements: string[] = []

    lines.forEach(line => {
      const trimmedLine = line.trim()
      
      if (trimmedLine.toLowerCase().includes('title:') || trimmedLine.toLowerCase().includes('position:')) {
        currentExp.title = trimmedLine.split(':')[1]?.trim() || ''
      } else if (trimmedLine.toLowerCase().includes('company:')) {
        currentExp.company = trimmedLine.split(':')[1]?.trim() || ''
      } else if (trimmedLine.toLowerCase().includes('start') && trimmedLine.includes(':')) {
        currentExp.startDate = trimmedLine.split(':')[1]?.trim() || ''
      } else if (trimmedLine.toLowerCase().includes('end') && trimmedLine.includes(':')) {
        currentExp.endDate = trimmedLine.split(':')[1]?.trim() || ''
      } else if (trimmedLine.toLowerCase().includes('location:')) {
        currentExp.location = trimmedLine.split(':')[1]?.trim() || ''
      } else if (trimmedLine.toLowerCase().includes('description:')) {
        currentExp.description = trimmedLine.split(':')[1]?.trim() || ''
      } else if (trimmedLine.startsWith('•') || trimmedLine.startsWith('-')) {
        currentAchievements.push(trimmedLine.replace(/^[•\-]\s*/, ''))
      } else if (trimmedLine.toLowerCase().includes('achievement') || trimmedLine.toLowerCase().includes('responsibility')) {
        const achievement = trimmedLine.split(':')[1]?.trim()
        if (achievement) currentAchievements.push(achievement)
      }
    })

    currentExp.achievements = currentAchievements
    if (currentExp.title || currentExp.company) {
      experiences.push(currentExp as ParsedExperience)
    }

    return experiences
  }

  const parseEducationContent = (lines: string[]): ParsedEducation[] => {
    const educations: ParsedEducation[] = []
    const currentEdu: Partial<ParsedEducation> = {}
    const currentHonors: string[] = []

    lines.forEach(line => {
      const trimmedLine = line.trim()
      
      if (trimmedLine.toLowerCase().includes('degree:')) {
        currentEdu.degree = trimmedLine.split(':')[1]?.trim() || ''
      } else if (trimmedLine.toLowerCase().includes('school:') || trimmedLine.toLowerCase().includes('university:')) {
        currentEdu.school = trimmedLine.split(':')[1]?.trim() || ''
      } else if (trimmedLine.toLowerCase().includes('graduation:') || trimmedLine.toLowerCase().includes('year:')) {
        currentEdu.graduationDate = trimmedLine.split(':')[1]?.trim() || ''
      } else if (trimmedLine.toLowerCase().includes('gpa:')) {
        currentEdu.gpa = trimmedLine.split(':')[1]?.trim() || ''
      } else if (trimmedLine.toLowerCase().includes('location:')) {
        currentEdu.location = trimmedLine.split(':')[1]?.trim() || ''
      } else if (trimmedLine.startsWith('•') || trimmedLine.startsWith('-')) {
        currentHonors.push(trimmedLine.replace(/^[•\-]\s*/, ''))
      }
    })

    currentEdu.honors = currentHonors
    if (currentEdu.degree || currentEdu.school) {
      educations.push(currentEdu as ParsedEducation)
    }

    return educations
  }

  const parseSkillsContent = (lines: string[]): string[] => {
    const skills: string[] = []
    
    lines.forEach(line => {
      if (line.includes(':')) {
        const skillsPart = line.split(':')[1]?.trim()
        if (skillsPart) {
          skills.push(...skillsPart.split(/[,\n]/).map(s => s.trim()).filter(s => s))
        }
      } else if (line.includes(',')) {
        skills.push(...line.split(',').map(s => s.trim()).filter(s => s))
      } else if (line.trim() && !line.toLowerCase().includes('skill')) {
        skills.push(line.trim())
      }
    })

    return [...new Set(skills)] // Remove duplicates
  }

  const parseProjectsContent = (lines: string[]): ParsedProject[] => {
    const projects: ParsedProject[] = []
    const currentProject: Partial<ParsedProject> = {}
    const currentDetails: string[] = []
    const currentTechnologies: string[] = []

    lines.forEach(line => {
      const trimmedLine = line.trim()
      
      if (trimmedLine.toLowerCase().includes('name:') || trimmedLine.toLowerCase().includes('project:')) {
        currentProject.name = trimmedLine.split(':')[1]?.trim() || ''
      } else if (trimmedLine.toLowerCase().includes('description:')) {
        currentProject.description = trimmedLine.split(':')[1]?.trim() || ''
      } else if (trimmedLine.toLowerCase().includes('url:') || trimmedLine.toLowerCase().includes('link:')) {
        currentProject.url = trimmedLine.split(':')[1]?.trim() || ''
      } else if (trimmedLine.toLowerCase().includes('technologies:') || trimmedLine.toLowerCase().includes('tech:')) {
        const techStr = trimmedLine.split(':')[1]?.trim()
        if (techStr) {
          currentTechnologies = techStr.split(',').map(t => t.trim())
        }
      } else if (trimmedLine.startsWith('•') || trimmedLine.startsWith('-')) {
        currentDetails.push(trimmedLine.replace(/^[•\-]\s*/, ''))
      }
    })

    currentProject.details = currentDetails
    currentProject.technologies = currentTechnologies
    if (currentProject.name || currentProject.description) {
      projects.push(currentProject as ParsedProject)
    }

    return projects
  }

  const renderContactFields = (contact: ParsedContact) => (
    <div className="space-y-4">
      {Object.entries(contact).map(([field, value]) => (
        value && (
          <div key={field} className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <Label className="text-xs font-medium capitalize">{field}</Label>
              <Input
                value={value}
                readOnly
                className="mt-1 text-sm bg-muted/50"
              />
            </div>
            <Button
              size="sm"
              variant={appliedFields.has(`contact.${field}`) ? "default" : "outline"}
              onClick={() => handleApplyField(`contact.${field}`, value)}
              className="shrink-0"
            >
              {appliedFields.has(`contact.${field}`) ? (
                <CheckCircle className="h-3 w-3" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </Button>
          </div>
        )
      ))}
    </div>
  )

  const renderSummaryField = (summary: string) => (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <Label className="text-xs font-medium">Professional Summary</Label>
          <Textarea
            value={summary}
            readOnly
            className="mt-1 text-sm bg-muted/50 min-h-24"
          />
        </div>
        <Button
          size="sm"
          variant={appliedFields.has('summary') ? "default" : "outline"}
          onClick={() => handleApplyField('summary', summary)}
          className="shrink-0 mt-6"
        >
          {appliedFields.has('summary') ? (
            <CheckCircle className="h-3 w-3" />
          ) : (
            <Copy className="h-3 w-3" />
          )}
        </Button>
      </div>
    </div>
  )

  const renderExperienceFields = (experiences: ParsedExperience[]) => (
    <div className="space-y-6">
      {experiences.map((exp, index) => (
        <Card key={index} className="border-dashed">
          <CardContent className="p-4 space-y-4">
            <h4 className="font-medium text-sm">Experience {index + 1}</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs">Job Title</Label>
                <div className="flex gap-2">
                  <Input value={exp.title || ''} readOnly className="text-sm bg-muted/50" />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleApplyField(`experience.${index}.title`, exp.title)}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              
              <div>
                <Label className="text-xs">Company</Label>
                <div className="flex gap-2">
                  <Input value={exp.company || ''} readOnly className="text-sm bg-muted/50" />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleApplyField(`experience.${index}.company`, exp.company)}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs">Start Date</Label>
                <div className="flex gap-2">
                  <Input value={exp.startDate || ''} readOnly className="text-sm bg-muted/50" />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleApplyField(`experience.${index}.startDate`, exp.startDate)}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              
              <div>
                <Label className="text-xs">End Date</Label>
                <div className="flex gap-2">
                  <Input value={exp.endDate || ''} readOnly className="text-sm bg-muted/50" />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleApplyField(`experience.${index}.endDate`, exp.endDate)}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>

            <div>
              <Label className="text-xs">Description</Label>
              <div className="flex gap-2">
                <Input value={exp.description || ''} readOnly className="text-sm bg-muted/50" />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleApplyField(`experience.${index}.description`, exp.description)}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>

            {exp.achievements && exp.achievements.length > 0 && (
              <div>
                <Label className="text-xs">Achievements</Label>
                <div className="flex gap-2">
                  <Textarea
                    value={exp.achievements.map(a => `• ${a}`).join('\n')}
                    readOnly
                    className="text-sm bg-muted/50 min-h-20"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleApplyField(`experience.${index}.achievements`, exp.achievements.join('\n'))}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )

  const renderSkillsFields = (skills: string[]) => (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <Label className="text-xs font-medium">Skills</Label>
          <Textarea
            value={skills.join(', ')}
            readOnly
            className="mt-1 text-sm bg-muted/50 min-h-20"
          />
        </div>
        <Button
          size="sm"
          variant={appliedFields.has('skills') ? "default" : "outline"}
          onClick={() => handleApplyField('skills', skills.join(', '))}
          className="shrink-0 mt-6"
        >
          {appliedFields.has('skills') ? (
            <CheckCircle className="h-3 w-3" />
          ) : (
            <Copy className="h-3 w-3" />
          )}
        </Button>
      </div>
    </div>
  )

  const parsedContent = parseEnhancedContent()

  if (!parsedContent) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p className="text-sm">Enhanced content will appear here</p>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {sectionType === 'contact' && renderContactFields(parsedContent as ParsedContact)}
      {sectionType === 'summary' && renderSummaryField(parsedContent as string)}
      {sectionType === 'experience' && renderExperienceFields(parsedContent as ParsedExperience[])}
      {sectionType === 'skills' && renderSkillsFields(parsedContent as string[])}
      {/* Add other section types as needed */}
    </motion.div>
  )
}