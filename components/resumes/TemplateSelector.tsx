'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { TemplateService, ResumeLanguage } from '@/lib/templates'
import { Check } from 'lucide-react'

interface TemplateSelectorProps {
  currentTemplateId?: string
  detectedLanguage?: ResumeLanguage
  onTemplateSelect: (templateId: string) => void
}

export function TemplateSelector({ 
  currentTemplateId, 
  detectedLanguage = 'en', 
  onTemplateSelect 
}: TemplateSelectorProps) {
  const [selectedLanguage, setSelectedLanguage] = useState<ResumeLanguage>(detectedLanguage)
  
  // Get templates for the selected language
  const availableTemplates = TemplateService.getTemplatesByLanguage(selectedLanguage)
  
  const handleLanguageChange = (language: ResumeLanguage) => {
    setSelectedLanguage(language)
    // Auto-select the first template for the new language
    const templates = TemplateService.getTemplatesByLanguage(language)
    if (templates.length > 0) {
      onTemplateSelect(templates[0].id)
    }
  }

  return (
    <div className="space-y-4">
      {/* Language Selection */}
      <div className="flex gap-2">
        <Button
          variant={selectedLanguage === 'en' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleLanguageChange('en')}
        >
          English
        </Button>
        <Button
          variant={selectedLanguage === 'zh' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleLanguageChange('zh')}
        >
          中文
        </Button>
      </div>

      {/* Template Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {availableTemplates.map((template) => (
          <Card 
            key={template.id}
            className={`cursor-pointer transition-all hover:shadow-md ${
              currentTemplateId === template.id ? 'ring-2 ring-blue-500' : ''
            }`}
            onClick={() => onTemplateSelect(template.id)}
          >
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-sm font-medium">
                    {template.name}
                  </CardTitle>
                  <div className="flex gap-2 mt-1">
                    <Badge variant="secondary" className="text-xs">
                      {template.style}
                    </Badge>
                    <Badge 
                      variant={template.atsScore >= 90 ? 'default' : 'secondary'} 
                      className="text-xs"
                    >
                      ATS {template.atsScore}%
                    </Badge>
                  </div>
                </div>
                {currentTemplateId === template.id && (
                  <div className="flex-shrink-0">
                    <Check className="h-5 w-5 text-blue-600" />
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {/* Template Preview Thumbnail */}
              <div className="bg-gray-100 rounded border h-24 mb-2 flex items-center justify-center text-xs text-gray-500">
                Template Preview
              </div>
              <CardDescription className="text-xs">
                {template.language === 'en' 
                  ? 'Professional layout optimized for English resumes'
                  : '适合中文简历的专业布局'
                }
              </CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Language Detection Info */}
      {detectedLanguage && (
        <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
          <strong>Detected language:</strong> {detectedLanguage === 'en' ? 'English' : 'Chinese'}
          {selectedLanguage !== detectedLanguage && (
            <span className="ml-2 text-orange-600">
              (You have selected a different language template)
            </span>
          )}
        </div>
      )}
    </div>
  )
}