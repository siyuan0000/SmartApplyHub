'use client'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { 
  LayoutDashboard, 
  FileText, 
  Briefcase, 
  Search, 
  Brain, 
  FileCheck,
  Settings,
  LogOut,
  User
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

const navigationItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Resumes', href: '/resumes', icon: FileText },
  { name: 'Applications', href: '/applications', icon: Briefcase },
  { name: 'Job Search', href: '/jobs', icon: Search },
  { name: 'AI Review', href: '/ai-review', icon: Brain },
  { name: 'Templates', href: '/templates', icon: FileCheck },
  { name: 'Settings', href: '/settings', icon: Settings },
]

interface SidebarProps {
  collapsed?: boolean
}

export function Sidebar({ collapsed = false }: SidebarProps) {
  const pathname = usePathname()
  const { user, signOut } = useAuth()

  return (
    <div className={cn(
      'flex h-full flex-col bg-background border-r',
      collapsed ? 'w-16' : 'w-64'
    )}>
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Brain className="h-5 w-5" />
          </div>
          {!collapsed && (
            <div>
              <h1 className="text-lg font-semibold">AI Resume Pro</h1>
              <p className="text-xs text-muted-foreground">Job Application Assistant</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-2 p-4">
        {navigationItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href

          return (
            <Link key={item.name} href={item.href}>
              <Button
                variant={isActive ? 'default' : 'ghost'}
                className={cn(
                  'w-full justify-start gap-3',
                  collapsed && 'justify-center'
                )}
              >
                <Icon className="h-4 w-4" />
                {!collapsed && item.name}
              </Button>
            </Link>
          )
        })}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t">
        <Card className="p-3">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary">
              <User className="h-4 w-4" />
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {user?.email || 'User'}
                </p>
                <p className="text-xs text-muted-foreground">Free Plan</p>
              </div>
            )}
          </div>
          {!collapsed && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full mt-3 justify-start gap-2"
              onClick={signOut}
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          )}
        </Card>
      </div>
    </div>
  )
}