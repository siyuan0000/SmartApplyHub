'use client'

import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useResumeEditor } from '@/hooks/useResumeEditor'

export function SummaryEditModal() {
  const { content, updateSummary } = useResumeEditor()

  if (!content) return null

  const characterCount = content.summary?.length || 0
  const wordCount = content.summary ? content.summary.trim().split(/\s+/).filter(word => word.length > 0).length : 0

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="summary">Professional Summary</Label>
        <p className="text-sm text-muted-foreground mt-1 mb-2">
          Write a compelling 2-3 sentence overview of your professional background, key skills, and career goals.
        </p>
        <Textarea
          id="summary"
          value={content.summary || ''}
          onChange={(e) => updateSummary(e.target.value)}
          placeholder="Experienced software engineer with 5+ years developing scalable web applications. Proven track record of leading cross-functional teams and delivering high-quality solutions. Passionate about leveraging technology to solve complex business problems and drive innovation."
          className="min-h-32 resize-none"
          maxLength={500}
        />
      </div>
      
      <div className="flex items-center justify-between text-sm text-muted-foreground pt-2 border-t">
        <div className="flex gap-4">
          <span>{characterCount}/500 characters</span>
          <span>{wordCount} words</span>
        </div>
        <div>
          {characterCount < 100 && (
            <span className="text-amber-600">Consider adding more detail</span>
          )}
          {characterCount >= 100 && characterCount <= 300 && (
            <span className="text-green-600">Good length</span>
          )}
          {characterCount > 300 && (
            <span className="text-blue-600">Comprehensive summary</span>
          )}
        </div>
      </div>
      
      <div className="bg-blue-50 p-3 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">💡 Tips for a strong summary:</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Start with your years of experience and key role</li>
          <li>• Highlight your most relevant skills and achievements</li>
          <li>• Mention your career goals or what you&apos;re passionate about</li>
          <li>• Keep it concise but impactful (2-3 sentences)</li>
        </ul>
      </div>
    </div>
  )
}