'use client'

import { Button } from '@/components/ui/button'
import { Menu, Bell, Plus } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { ApplicationWorkflowModal } from '@/components/applications/ApplicationWorkflowModal'
import { useApplicationWorkflowStore } from '@/store/application-workflow'

interface HeaderProps {
  onToggleSidebar?: () => void
}

export function Header({ onToggleSidebar }: HeaderProps) {
  const { openWorkflow } = useApplicationWorkflowStore()

  const handleNewApplication = () => {
    openWorkflow() // Open workflow without a pre-selected job
  }

  return (
    <header className="h-16 border-b bg-background px-6 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleSidebar}
          className="hover:bg-muted/80"
          title="Toggle sidebar (Ctrl+\)"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <Button size="sm" className="gap-2" onClick={handleNewApplication}>
          <Plus className="h-4 w-4" />
          New Application
        </Button>
        
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <Badge 
            variant="destructive" 
            className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
          >
            3
          </Badge>
        </Button>
      </div>
      <ApplicationWorkflowModal />
    </header>
  )
}