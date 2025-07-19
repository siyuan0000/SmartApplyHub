'use client'

import { useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { X, Sparkles } from 'lucide-react'

type SectionType = 'contact' | 'summary' | 'experience' | 'education' | 'skills' | 'projects'

interface EditModalProps {
  section: SectionType
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  onAIEnhance?: () => void
  isEnhancing?: boolean
}

const sectionTitles: Record<SectionType, string> = {
  contact: 'Contact Information',
  summary: 'Professional Summary',
  experience: 'Work Experience',
  education: 'Education',
  skills: 'Skills',
  projects: 'Projects'
}

const sectionDescriptions: Record<SectionType, string> = {
  contact: 'Update your contact details and professional links',
  summary: 'Write a compelling professional summary that highlights your key achievements',
  experience: 'Add your work history, roles, and accomplishments',
  education: 'Include your educational background and qualifications',
  skills: 'List your technical skills, tools, and competencies',
  projects: 'Showcase your personal and professional projects'
}

export function EditModal({ 
  section, 
  isOpen, 
  onClose, 
  children, 
  onAIEnhance,
  isEnhancing = false 
}: EditModalProps) {
  // Handle keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      // ESC to close modal
      if (event.key === 'Escape') {
        onClose()
      }
      // Ctrl/Cmd + S to save (handled by auto-save, just prevent default)
      else if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <DialogTitle className="text-xl font-semibold">
                Edit {sectionTitles[section]}
              </DialogTitle>
              <DialogDescription className="mt-1">
                {sectionDescriptions[section]}
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2 ml-4">
              {onAIEnhance && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onAIEnhance}
                  disabled={isEnhancing}
                  className="gap-2"
                >
                  <Sparkles className="h-4 w-4" />
                  {isEnhancing ? 'Enhancing...' : 'AI Enhance'}
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="p-2"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto py-4">
          {children}
        </div>
        
        <div className="flex-shrink-0 border-t pt-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Changes are saved automatically as you type
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Done
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}