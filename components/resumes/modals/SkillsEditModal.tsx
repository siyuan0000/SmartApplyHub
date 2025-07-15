'use client'

import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useResumeEditor } from '@/hooks/useResumeEditor'

export function SkillsEditModal() {
  const { content, updateSkills } = useResumeEditor()

  if (!content) return null

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="skills">Skills</Label>
        <p className="text-sm text-muted-foreground mt-1 mb-2">
          Enter your skills separated by commas. Include both technical and soft skills.
        </p>
        <Textarea
          id="skills"
          value={content.skills.join(', ')}
          onChange={(e) => updateSkills(e.target.value)}
          placeholder="JavaScript, React, Node.js, Python, SQL, Git, Problem Solving, Team Leadership, Communication"
          className="min-h-24 resize-none"
        />
      </div>
      
      {content.skills.length > 0 && (
        <div>
          <Label>Preview ({content.skills.length} skills)</Label>
          <div className="flex flex-wrap gap-2 mt-2 p-3 bg-gray-50 rounded-lg">
            {content.skills.map((skill, index) => (
              <Badge key={index} variant="secondary" className="text-sm">
                {skill}
              </Badge>
            ))}
          </div>
        </div>
      )}
      
      <div className="bg-green-50 p-3 rounded-lg">
        <h4 className="font-medium text-green-900 mb-2">💡 Skills tips:</h4>
        <ul className="text-sm text-green-800 space-y-1">
          <li>• Include both technical skills (programming languages, tools) and soft skills</li>
          <li>• List skills relevant to your target job</li>
          <li>• Use industry-standard terminology</li>
          <li>• Aim for 8-15 skills for optimal impact</li>
        </ul>
      </div>
    </div>
  )
}