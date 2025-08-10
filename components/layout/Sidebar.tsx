'use client'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { 
  LayoutDashboard, 
  FileText, 
  Briefcase, 
  Search, 
  Brain, 
  Settings,
  LogOut,
  User
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useUIStore } from '@/store/ui'
import { useIsMobile } from '@/hooks/use-mobile'

const navigationItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Resumes', href: '/resumes', icon: FileText },
  { name: 'Applications', href: '/applications', icon: Briefcase },
  { name: 'Job Search', href: '/jobs', icon: Search },
  { name: 'Settings', href: '/settings', icon: Settings },
]

interface SidebarProps {
  collapsed?: boolean // Keep for backward compatibility but will use store
}

export function Sidebar({ }: SidebarProps) {
  const pathname = usePathname()
  const { user, signOut } = useAuth()
  const isMobile = useIsMobile()
  const { 
    sidebarCollapsed, 
    sidebarHovered, 
    setSidebarHovered, 
    getSidebarVisible 
  } = useUIStore()
  
  const isVisible = getSidebarVisible()
  const shouldShowContent = isVisible

  const handleMouseEnter = () => {
    if (!isMobile && sidebarCollapsed) {
      setSidebarHovered(true)
    }
  }

  const handleMouseLeave = () => {
    if (!isMobile) {
      setSidebarHovered(false)
    }
  }

  return (
    <TooltipProvider>
      <div 
        className={cn(
          'flex h-full flex-col bg-background border-r transition-all duration-300 ease-in-out relative z-10',
          sidebarCollapsed ? 'w-16' : 'w-64',
          // On mobile, use overlay when expanded
          isMobile && !sidebarCollapsed && 'fixed inset-y-0 left-0 shadow-lg',
          // Hover effect for desktop
          !isMobile && sidebarCollapsed && sidebarHovered && 'w-64 shadow-lg'
        )}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Header */}
        <div className="p-4 border-b">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Brain className="h-5 w-5" />
            </div>
            <div className={cn(
              'transition-all duration-200 ease-in-out overflow-hidden',
              shouldShowContent ? 'opacity-100 w-auto' : 'opacity-0 w-0'
            )}>
              <h1 className="text-lg font-semibold whitespace-nowrap">Smart Apply</h1>
              <p className="text-xs text-muted-foreground whitespace-nowrap">Job Application Assistant</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-2 p-4">
          {navigationItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            const showTooltip = sidebarCollapsed && !sidebarHovered

            const button = (
              <Link key={item.name} href={item.href} className="block">
                <Button
                  variant={isActive ? 'default' : 'ghost'}
                  className={cn(
                    'w-full transition-all duration-200',
                    sidebarCollapsed && !sidebarHovered 
                      ? 'justify-center px-0 min-w-0' 
                      : 'justify-start gap-3'
                  )}
                >
                  <Icon className="btn-icon" />
                  <span className={cn(
                    'transition-all duration-150 ease-in-out overflow-hidden whitespace-nowrap',
                    shouldShowContent ? 'opacity-100 w-auto ml-3' : 'opacity-0 w-0 ml-0'
                  )}>
                    {item.name}
                  </span>
                </Button>
              </Link>
            )

            if (showTooltip) {
              return (
                <Tooltip key={item.name}>
                  <TooltipTrigger asChild>
                    {button}
                  </TooltipTrigger>
                  <TooltipContent side="right" className="ml-2">
                    {item.name}
                  </TooltipContent>
                </Tooltip>
              )
            }

            return button
          })}
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t">
          <Card className="p-3">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary">
                <User className="h-4 w-4" />
              </div>
              <div className={cn(
                'flex-1 min-w-0 transition-all duration-150 ease-in-out overflow-hidden',
                shouldShowContent ? 'opacity-100 w-auto' : 'opacity-0 w-0'
              )}>
                <p className="text-sm font-medium truncate whitespace-nowrap">
                  {user?.email || 'User'}
                </p>
                <p className="text-xs text-muted-foreground whitespace-nowrap">Free Plan</p>
              </div>
            </div>
            
            {shouldShowContent && (
              <div className={cn(
                'transition-all duration-150 ease-in-out mt-3',
                shouldShowContent ? 'opacity-100' : 'opacity-0'
              )}>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full justify-start gap-2"
                  onClick={signOut}
                >
                  <LogOut className="h-4 w-4" />
                  <span className="whitespace-nowrap">Sign Out</span>
                </Button>
              </div>
            )}
          </Card>
        </div>
      </div>
    </TooltipProvider>
  )
}