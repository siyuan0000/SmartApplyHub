'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { AppLayout } from '@/components/layout/AppLayout'
import { ResumeEditor } from '@/components/resumes/ResumeEditor'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Eye, Download } from 'lucide-react'
import Link from 'next/link'

export default function ResumePage() {
  const params = useParams()
  const resumeId = params.id as string
  const [mode, setMode] = useState<'edit' | 'preview'>('edit')

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/resumes">
              <Button variant="outline" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Resumes
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Resume Editor</h1>
              <p className="text-muted-foreground">
                Edit your resume sections and optimize with AI
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant={mode === 'edit' ? 'default' : 'outline'}
              onClick={() => setMode('edit')}
              className="gap-2"
            >
              Edit
            </Button>
            <Button
              variant={mode === 'preview' ? 'default' : 'outline'}
              onClick={() => setMode('preview')}
              className="gap-2"
            >
              <Eye className="h-4 w-4" />
              Preview
            </Button>
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        {/* Content */}
        {mode === 'edit' ? (
          <ResumeEditor resumeId={resumeId} />
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Resume preview coming soon...</p>
          </div>
        )}
      </div>
    </AppLayout>
  )
}