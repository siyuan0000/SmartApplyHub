'use client'

export const dynamic = 'force-dynamic'

import { AppLayout } from '@/components/layout/AppLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, Building } from 'lucide-react'

export default function Jobs() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Job Search</h1>
            <p className="text-muted-foreground">
              Find your next opportunity with AI-powered job matching
            </p>
          </div>
          <Button>Save Search</Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Job Search</CardTitle>
            <CardDescription>
              Search for jobs that match your skills and preferences
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search jobs..."
                  className="pl-10"
                />
              </div>
              <Button>Search</Button>
            </div>
          </CardContent>
        </Card>

        <div className="text-center py-12">
          <Building className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Job Search Coming Soon</h3>
          <p className="text-muted-foreground">
            We&apos;re working on integrating with major job boards to bring you the best opportunities.
          </p>
        </div>
      </div>
    </AppLayout>
  )
}