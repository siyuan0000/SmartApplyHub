'use client'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  User, 
  FileText, 
  Briefcase, 
  GraduationCap, 
  Wrench, 
  Rocket,
  Check,
  AlertTriangle,
  Circle
} from 'lucide-react'
import { useResumeEditor, SectionType } from '@/hooks/useResumeEditor'

const sections = [
  { 
    id: 'contact' as SectionType, 
    label: 'Contact Info', 
    icon: User,
    description: 'Name, email, phone, etc.'
  },
  { 
    id: 'summary' as SectionType, 
    label: 'Summary', 
    icon: FileText,
    description: 'Professional overview'
  },
  { 
    id: 'experience' as SectionType, 
    label: 'Experience', 
    icon: Briefcase,
    description: 'Work history and achievements'
  },
  { 
    id: 'education' as SectionType, 
    label: 'Education', 
    icon: GraduationCap,
    description: 'Schools and degrees'
  },
  { 
    id: 'skills' as SectionType, 
    label: 'Skills', 
    icon: Wrench,
    description: 'Technical and soft skills'
  },
  { 
    id: 'projects' as SectionType, 
    label: 'Projects', 
    icon: Rocket,
    description: 'Personal and work projects'
  }
]

interface SectionNavigationProps {
  onSectionEdit: (section: SectionType) => void
}

export function SectionNavigation({ onSectionEdit }: SectionNavigationProps) {
  const { 
    activeSection, 
    setActiveSection, 
    getSectionCompletionStatus,
    saveResume,
    saving
  } = useResumeEditor()

  const getStatusIcon = (status: 'complete' | 'incomplete' | 'empty') => {
    switch (status) {
      case 'complete':
        return <Check className="h-4 w-4 text-green-600" />
      case 'incomplete':
        return <AlertTriangle className="h-4 w-4 text-amber-600" />
      case 'empty':
        return <Circle className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusBadge = (status: 'complete' | 'incomplete' | 'empty') => {
    switch (status) {
      case 'complete':
        return <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">Complete</Badge>
      case 'incomplete':
        return <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-amber-200">In Progress</Badge>
      case 'empty':
        return <Badge variant="outline" className="text-gray-600">Empty</Badge>
    }
  }

  const handleSectionClick = (section: SectionType) => {
    setActiveSection(section)
    onSectionEdit(section)
  }

  return (
    <div className="space-y-4">
      {/* Section List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Resume Sections</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {sections.map((section) => {
            const Icon = section.icon
            const status = getSectionCompletionStatus(section.id)
            const isActive = activeSection === section.id

            return (
              <div
                key={section.id}
                className={cn(
                  'p-3 rounded-lg border transition-all duration-200 cursor-pointer hover:shadow-sm',
                  isActive 
                    ? 'bg-blue-50 border-blue-200 shadow-sm' 
                    : 'border-gray-200 hover:border-gray-300'
                )}
                onClick={() => handleSectionClick(section.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={cn(
                      'p-2 rounded-lg',
                      isActive ? 'bg-blue-100' : 'bg-gray-100'
                    )}>
                      <Icon className={cn(
                        'h-4 w-4',
                        isActive ? 'text-blue-600' : 'text-gray-600'
                      )} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className={cn(
                          'font-medium truncate',
                          isActive ? 'text-blue-900' : 'text-gray-900'
                        )}>
                          {section.label}
                        </h3>
                        {getStatusIcon(status)}
                      </div>
                      <p className={cn(
                        'text-sm truncate',
                        isActive ? 'text-blue-700' : 'text-gray-600'
                      )}>
                        {section.description}
                      </p>
                    </div>
                  </div>
                  <div className="ml-2">
                    {getStatusBadge(status)}
                  </div>
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* Save Button */}
      <Card>
        <CardContent className="pt-6">
          <Button
            onClick={saveResume}
            disabled={saving}
            className="w-full gap-2"
            size="lg"
          >
            {saving ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                Saving...
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                Save Resume
              </>
            )}
          </Button>
          <p className="text-xs text-muted-foreground text-center mt-2">
            Changes are auto-saved while editing
          </p>
        </CardContent>
      </Card>
    </div>
  )
}