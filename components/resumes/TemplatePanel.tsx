'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { TemplateService, ResumeLanguage } from '@/lib/templates'
import { Palette, Check } from 'lucide-react'

interface TemplatePanelProps {
  currentTemplateId?: string
  detectedLanguage?: ResumeLanguage
  onTemplateSelect: (templateId: string) => void
  className?: string
}

export function TemplatePanel({ 
  currentTemplateId, 
  detectedLanguage = 'en', 
  onTemplateSelect,
  className = ''
}: TemplatePanelProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [selectedLanguage, setSelectedLanguage] = useState<ResumeLanguage>(detectedLanguage)
  
  // Auto-select recommended template if none is selected
  useEffect(() => {
    if (!currentTemplateId) {
      const recommended = TemplateService.getRecommendedTemplate(detectedLanguage)
      onTemplateSelect(recommended.id)
    }
  }, [currentTemplateId, detectedLanguage, onTemplateSelect])
  
  const availableTemplates = TemplateService.getTemplatesByLanguage(selectedLanguage)
  const currentTemplate = currentTemplateId ? TemplateService.getTemplate(currentTemplateId) : null

  const handleLanguageChange = (language: ResumeLanguage) => {
    setSelectedLanguage(language)
    const templates = TemplateService.getTemplatesByLanguage(language)
    if (templates.length > 0) {
      onTemplateSelect(templates[0].id)
    }
  }

  return (
    <Card className={className}>
      <CardHeader 
        className="cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <CardTitle className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Resume Template
          </div>
          <div className="flex items-center gap-2">
            {currentTemplate && (
              <Badge variant="secondary" className="text-xs">
                {currentTemplate.name}
              </Badge>
            )}
            <span className="text-xs text-gray-500">
              {isExpanded ? '▲' : '▼'}
            </span>
          </div>
        </CardTitle>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="space-y-4">
          {/* Language Toggle */}
          <div className="flex gap-2">
            <Button
              variant={selectedLanguage === 'en' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleLanguageChange('en')}
              className="flex-1"
            >
              English
            </Button>
            <Button
              variant={selectedLanguage === 'zh' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleLanguageChange('zh')}
              className="flex-1"
            >
              中文
            </Button>
          </div>

          {/* Template Options */}
          <div className="space-y-2">
            {availableTemplates.map((template) => (
              <div
                key={template.id}
                className={`p-3 border rounded-lg cursor-pointer transition-all hover:bg-gray-50 ${
                  currentTemplateId === template.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                }`}
                onClick={() => onTemplateSelect(template.id)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{template.name}</span>
                      {currentTemplateId === template.id && (
                        <Check className="h-4 w-4 text-blue-600" />
                      )}
                    </div>
                    <div className="flex gap-1 mt-1">
                      <Badge variant="outline" className="text-xs">
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
                </div>
              </div>
            ))}
          </div>

          {/* Language Detection Info */}
          {detectedLanguage && selectedLanguage !== detectedLanguage && (
            <div className="text-xs text-orange-600 bg-orange-50 p-2 rounded border border-orange-200">
              <strong>Note:</strong> Detected language is {detectedLanguage === 'en' ? 'English' : 'Chinese'}, 
              but you have selected a {selectedLanguage === 'en' ? 'English' : 'Chinese'} template.
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}