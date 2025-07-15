'use client'

import { useRef, useCallback, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useUIStore } from '@/store/ui'
import { useIsMobile } from '@/hooks/use-mobile'

interface Section {
  id: string
  label: string
  icon: string
}

interface ResumeEditorSidebarProps {
  sections: Section[]
  activeSection: string
  onSectionChange: (sectionId: string) => void
}

export function ResumeEditorSidebar({ 
  sections, 
  activeSection, 
  onSectionChange 
}: ResumeEditorSidebarProps) {
  const isMobile = useIsMobile()
  const autoCollapseTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  const { 
    editorSidebarCollapsed, 
    setEditorSidebarHovered, 
    toggleEditorSidebar,
    autoCollapseEditorSidebar,
    getEditorSidebarVisible
  } = useUIStore()
  
  const isVisible = getEditorSidebarVisible()
  const shouldShowContent = isVisible

  // Auto-collapse functionality
  const scheduleAutoCollapse = useCallback(() => {
    if (isMobile) return // Don't auto-collapse on mobile
    
    if (autoCollapseTimeoutRef.current) {
      clearTimeout(autoCollapseTimeoutRef.current)
    }
    
    autoCollapseTimeoutRef.current = setTimeout(() => {
      autoCollapseEditorSidebar()
    }, 500) // 500ms delay before auto-collapse
  }, [isMobile, autoCollapseEditorSidebar])

  const handleMouseEnter = useCallback(() => {
    if (autoCollapseTimeoutRef.current) {
      clearTimeout(autoCollapseTimeoutRef.current)
    }
    setEditorSidebarHovered(true)
  }, [setEditorSidebarHovered])

  const handleMouseLeave = useCallback(() => {
    setEditorSidebarHovered(false)
    if (!isMobile && editorSidebarCollapsed) {
      scheduleAutoCollapse()
    }
  }, [setEditorSidebarHovered, isMobile, editorSidebarCollapsed, scheduleAutoCollapse])

  const handleSectionClick = (sectionId: string) => {
    onSectionChange(sectionId)
    // Auto-collapse after section selection on mobile
    if (isMobile && !editorSidebarCollapsed) {
      scheduleAutoCollapse()
    }
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Escape to collapse editor sidebar
      if (event.key === 'Escape' && !editorSidebarCollapsed) {
        autoCollapseEditorSidebar()
      }
      // Ctrl/Cmd + E to toggle editor sidebar
      else if ((event.metaKey || event.ctrlKey) && event.key === 'e') {
        event.preventDefault()
        toggleEditorSidebar()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [toggleEditorSidebar, autoCollapseEditorSidebar, editorSidebarCollapsed])

  // Cleanup timeouts
  useEffect(() => {
    return () => {
      if (autoCollapseTimeoutRef.current) {
        clearTimeout(autoCollapseTimeoutRef.current)
      }
    }
  }, [])

  return (
    <>
      {/* Mobile overlay when sidebar is open */}
      {isMobile && isVisible && (
        <div 
          className="fixed inset-0 bg-black/50 z-[25]"
          onClick={toggleEditorSidebar}
        />
      )}
      
      <div
        className={cn(
          "relative transition-all duration-300 ease-in-out",
          // Desktop positioning
          !isMobile && [
            "flex-shrink-0",
            isVisible ? "w-60" : "w-16"
          ],
          // Mobile positioning
          isMobile && [
            "fixed top-0 left-0 h-full z-30",
            editorSidebarCollapsed ? "-translate-x-full w-60" : "translate-x-0 w-60"
          ]
        )}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <Card className={cn(
          "h-full w-full border-r border-border bg-card transition-all duration-300 ease-in-out",
          !isMobile && "border-l-0 border-t-0 border-b-0 rounded-none",
          isMobile && "rounded-r-lg shadow-xl"
        )}>
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              {shouldShowContent && (
                <h3 className="font-semibold text-sm">Sections</h3>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleEditorSidebar}
                className={cn(
                  "h-8 w-8 p-0",
                  !shouldShowContent && "mx-auto"
                )}
              >
                <span className="sr-only">Toggle section navigation</span>
                {editorSidebarCollapsed ? '→' : '←'}
              </Button>
            </div>
          </div>
          
          <div className="p-2 space-y-1">
            <TooltipProvider>
              {sections.map((section) => {
                const isActive = activeSection === section.id
                
                return (
                  <Tooltip key={section.id} delayDuration={shouldShowContent ? 1000 : 300}>
                    <TooltipTrigger asChild>
                      <Button
                        variant={isActive ? 'default' : 'ghost'}
                        className={cn(
                          "w-full transition-colors",
                          shouldShowContent ? "justify-start gap-3 px-3" : "justify-center p-2",
                          isActive && "bg-primary text-primary-foreground"
                        )}
                        onClick={() => handleSectionClick(section.id)}
                      >
                        <span className="text-lg">{section.icon}</span>
                        {shouldShowContent && (
                          <span className="font-medium">{section.label}</span>
                        )}
                      </Button>
                    </TooltipTrigger>
                    {!shouldShowContent && (
                      <TooltipContent side="right" align="center">
                        <p>{section.label}</p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                )
              })}
            </TooltipProvider>
          </div>
        </Card>
      </div>
    </>
  )
}