'use client'

import { useRef, useCallback } from 'react'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useUIStore } from '@/store/ui'
import { useIsMobile } from '@/hooks/use-mobile'
import { cn } from '@/lib/utils'

interface AppLayoutProps {
  children: React.ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const isMobile = useIsMobile()
  const mainContentRef = useRef<HTMLDivElement>(null)
  const autoCollapseTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  const { 
    sidebarCollapsed, 
    toggleSidebar, 
    autoCollapseSidebar
  } = useUIStore()

  // Auto-collapse functionality
  const scheduleAutoCollapse = useCallback(() => {
    if (isMobile) return // Don't auto-collapse on mobile
    
    if (autoCollapseTimeoutRef.current) {
      clearTimeout(autoCollapseTimeoutRef.current)
    }
    
    autoCollapseTimeoutRef.current = setTimeout(() => {
      autoCollapseSidebar()
    }, 500) // 500ms delay before auto-collapse
  }, [isMobile, autoCollapseSidebar])

  // Handle main content clicks for auto-collapse
  const handleMainContentClick = useCallback(() => {
    if (!isMobile && !sidebarCollapsed) {
      scheduleAutoCollapse()
    }
  }, [isMobile, sidebarCollapsed, scheduleAutoCollapse])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Cmd/Ctrl + \ to toggle sidebar
      if ((event.metaKey || event.ctrlKey) && event.key === '\\') {
        event.preventDefault()
        toggleSidebar()
      }
      // Escape to collapse if expanded
      else if (event.key === 'Escape' && !sidebarCollapsed) {
        autoCollapseSidebar()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [toggleSidebar, autoCollapseSidebar, sidebarCollapsed])

  // Authentication redirect
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  // Cleanup timeouts
  useEffect(() => {
    return () => {
      if (autoCollapseTimeoutRef.current) {
        clearTimeout(autoCollapseTimeoutRef.current)
      }
    }
  }, [])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="h-screen flex relative">
      <Sidebar />
      
      {/* Mobile overlay when sidebar is open */}
      {isMobile && !sidebarCollapsed && (
        <div 
          className="fixed inset-0 bg-black/50 z-[5]"
          onClick={toggleSidebar}
        />
      )}
      
      <div 
        className={cn(
          "flex-1 flex flex-col overflow-hidden transition-all duration-300 ease-in-out",
          // Ensure consistent layout without content shifting
          !isMobile && "min-w-0"
        )}
        ref={mainContentRef}
        onClick={handleMainContentClick}
      >
        <Header onToggleSidebar={toggleSidebar} />
        
        <main className="flex-1 overflow-y-auto bg-muted/10 p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}