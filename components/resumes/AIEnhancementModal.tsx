'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Lightbulb, Sparkles, Wand2, AlertCircle, Target } from 'lucide-react'
import { EnhancementContext, SectionEnhancementResult, useSectionEnhancement } from '@/hooks/useSectionEnhancement'

interface AIEnhancementModalProps {
  isOpen: boolean
  onClose: () => void
  sectionType: string
  originalContent: string
  onEnhanced: (result: SectionEnhancementResult) => void
  onStartStream?: (context: EnhancementContext) => void
}

export function AIEnhancementModal({
  isOpen,
  onClose,
  sectionType,
  originalContent,
  onEnhanced,
  onStartStream
}: AIEnhancementModalProps) {
  const { enhanceSectionStream, getHRInsights, isEnhancing, error, clearError, streamedText } = useSectionEnhancement()
  const [customPrompt, setCustomPrompt] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [selectedInsights, setSelectedInsights] = useState<string[]>([])
  
  const hrInsights = getHRInsights(sectionType)
  const isEmpty = !originalContent || !originalContent.trim()
  
  const handleEnhance = async () => {
    clearError()
    
    const context: EnhancementContext = {
      sectionType,
      originalContent,
      customPrompt: customPrompt.trim() || undefined,
      jobDescription: jobDescription.trim() || undefined,
      hrInsights: selectedInsights.length > 0 ? selectedInsights : undefined
    }
    
    // If onStartStream is provided, use new flow (close modal immediately)
    if (onStartStream) {
      onStartStream(context)
      onClose()
      // Reset form
      setCustomPrompt('')
      setJobDescription('')
      setSelectedInsights([])
      return
    }
    
    // Fallback to old flow for backwards compatibility
    await enhanceSectionStream(context)
  }

  const extractEnhancedContent = (text: string): string => {
    const match = text.match(/=== ENHANCED_CONTENT ===\s*([\s\S]*)$/i)
    return match ? match[1].trim() : ''
  }

  const handleCopyEnhanced = () => {
    const enhancedContent = extractEnhancedContent(streamedText)
    if (enhancedContent) {
      onEnhanced({
        enhancedText: enhancedContent,
        suggestions: [],
        changes: [],
        provider: 'stream'
      })
      onClose()
      // Reset form
      setCustomPrompt('')
      setJobDescription('')
      setSelectedInsights([])
    }
  }
  
  const toggleInsight = (insight: string) => {
    setSelectedInsights(prev => 
      prev.includes(insight) 
        ? prev.filter(i => i !== insight)
        : [...prev, insight]
    )
  }
  
  const quickPrompts = {
    contact: isEmpty ? [
      "Create professional contact information for a software engineer",
      "Generate modern professional contact layout",
      "Create ATS-optimized contact section"
    ] : [
      "Make my contact information more professional",
      "Optimize for ATS scanning", 
      "Add modern professional touches"
    ],
    about: isEmpty ? [
      "Create engaging LinkedIn-style about section for a tech professional",
      "Generate compelling personal brand summary with leadership focus",
      "Create industry-specific about section with keywords",
      "Write personal story connecting experiences and goals"
    ] : [
      "Make it more engaging and personal",
      "Focus on leadership and achievements",
      "Optimize for LinkedIn visibility",
      "Add industry-specific keywords"
    ],
    experience: isEmpty ? [
      "Create 3-5 years software engineer experience with quantified achievements",
      "Generate senior developer experience emphasizing leadership",
      "Create full-stack developer experience with team impact",
      "Generate experience focusing on problem-solving and innovation"
    ] : [
      "Quantify achievements with specific numbers",
      "Emphasize leadership and impact", 
      "Make it more action-oriented",
      "Highlight problem-solving abilities"
    ],
    education: isEmpty ? [
      "Create Computer Science degree with relevant coursework",
      "Generate education section with academic honors and projects", 
      "Create technical education emphasizing practical skills"
    ] : [
      "Highlight relevant coursework and projects",
      "Emphasize academic achievements",
      "Make it more concise and impactful"
    ],
    skills: isEmpty ? [
      "Create comprehensive technical skills for full-stack developer",
      "Generate balanced skills including programming languages and frameworks",
      "Create skills section organized by categories (Frontend, Backend, DevOps)",
      "Generate modern tech stack with trending technologies"
    ] : [
      "Organize by proficiency and relevance",
      "Add industry-specific technologies",
      "Balance technical and soft skills", 
      "Optimize for job matching"
    ],
    projects: isEmpty ? [
      "Create 2-3 impressive software projects with technical details",
      "Generate full-stack projects emphasizing innovation and impact",
      "Create open-source projects highlighting collaboration",
      "Generate projects showing problem-solving and measurable outcomes"
    ] : [
      "Emphasize technical complexity and impact",
      "Highlight problem-solving and innovation",
      "Focus on measurable outcomes",
      "Add relevant technologies used"
    ]
  }
  
  const currentQuickPrompts = quickPrompts[sectionType as keyof typeof quickPrompts] || []
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-3">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Wand2 className="h-5 w-5 text-primary" />
            </div>
            {isEmpty ? 'AI Create' : 'AI Enhancement'}: {sectionType.charAt(0).toUpperCase() + sectionType.slice(1)} Section
          </DialogTitle>
          <DialogDescription className="text-base">
            {isEmpty 
              ? `Create a professional ${sectionType} section from scratch using AI and HR expert insights.`
              : `Transform your ${sectionType} section with AI-powered improvements using HR expert insights and custom instructions.`
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-8">
          {error && (
            <div className="bg-destructive/5 border border-destructive/15 rounded-xl p-4">
              <div className="flex items-center gap-3 text-destructive mb-2">
                <div className="p-1 bg-destructive/10 rounded-lg">
                  <AlertCircle className="h-4 w-4" />
                </div>
                <span className="font-semibold">Enhancement Error</span>
              </div>
              <p className="text-sm text-destructive/90 leading-relaxed">{error}</p>
            </div>
          )}

          {/* Custom Instructions Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                <Target className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">{isEmpty ? 'Creation' : 'Enhancement'} Instructions</h3>
                <p className="text-sm text-muted-foreground">
                  {isEmpty 
                    ? 'Tell the AI what kind of content you want to create'
                    : 'Tell the AI exactly what you want to improve'
                  }
                </p>
              </div>
            </div>
            <Textarea
              placeholder={isEmpty 
                ? `E.g., for ${sectionType}: "Create a ${sectionType} section for a senior software engineer with 5 years experience, emphasize full-stack development and team leadership..."`
                : `E.g., for ${sectionType}: "Focus on quantifying achievements with specific metrics, emphasize leadership experience, and use action-oriented language..."`
              }
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              className="min-h-24 text-base resize-none"
            />
          </div>

          {/* Job Context Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-green-50 dark:bg-green-950/30 rounded-lg">
                <Target className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Target Job Context</h3>
                <p className="text-sm text-muted-foreground">Optional: Paste job description for tailored improvements</p>
              </div>
            </div>
            <Textarea
              placeholder="Paste the job description you're targeting to get more relevant, tailored enhancements that match the role's requirements..."
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              className="min-h-20 text-base resize-none"
            />
          </div>

          {/* Quick Options */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-purple-50 dark:bg-purple-950/30 rounded-lg">
                <Sparkles className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Quick {isEmpty ? 'Creation' : 'Enhancement'} Templates</h3>
                <p className="text-sm text-muted-foreground">
                  {isEmpty 
                    ? 'Click any template to use as your creation instruction'
                    : 'Click any template to use as your enhancement instruction'
                  }
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {currentQuickPrompts.map((prompt, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className="justify-start text-left whitespace-normal h-auto py-3 px-4 hover:bg-purple-50 hover:border-purple-200 dark:hover:bg-purple-950/30"
                  onClick={() => setCustomPrompt(prompt)}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-purple-400 rounded-full mt-1.5 flex-shrink-0" />
                    <span className="text-sm leading-relaxed">{prompt}</span>
                  </div>
                </Button>
              ))}
            </div>
          </div>

          {/* HR Expert Guidelines */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-amber-50 dark:bg-amber-950/30 rounded-lg">
                <Lightbulb className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">HR Expert Guidelines</h3>
                <p className="text-sm text-muted-foreground">Select professional insights to focus on during enhancement</p>
              </div>
            </div>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {hrInsights.map((insight, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border cursor-pointer transition-all text-sm ${
                    selectedInsights.includes(insight)
                      ? 'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-300'
                      : 'bg-muted/30 border-border hover:bg-muted/50 hover:border-muted-foreground/20'
                  }`}
                  onClick={() => toggleInsight(insight)}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 transition-colors ${
                      selectedInsights.includes(insight) ? 'bg-amber-500' : 'bg-muted-foreground/50'
                    }`} />
                    <span className="leading-relaxed">{insight}</span>
                  </div>
                </div>
              ))}
            </div>
            {selectedInsights.length > 0 && (
              <div className="p-3 bg-gradient-to-r from-amber-50 to-blue-50 dark:from-amber-950/20 dark:to-blue-950/20 rounded-lg border border-amber-200/50 dark:border-amber-800/50">
                <div className="flex flex-wrap gap-2">
                  <span className="text-sm font-semibold text-amber-800 dark:text-amber-300 mr-2">
                    Selected Focus Areas ({selectedInsights.length}):
                  </span>
                  {selectedInsights.map((insight, index) => (
                    <Badge key={index} variant="secondary" className="text-xs bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                      {insight.split(' ').slice(0, 4).join(' ')}...
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Original Content Preview */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-slate-50 dark:bg-slate-950/30 rounded-lg">
                <div className="h-4 w-4 bg-slate-400 rounded-sm" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">{isEmpty ? 'Starting Point' : 'Current Content Preview'}</h3>
                <p className="text-sm text-muted-foreground">
                  {isEmpty 
                    ? 'AI will create new content from scratch'
                    : 'This is what will be enhanced'
                  }
                </p>
              </div>
            </div>
            <div className={`p-4 rounded-lg border max-h-32 overflow-y-auto ${
              isEmpty 
                ? 'bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200 dark:border-blue-800'
                : 'bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900/50 dark:to-slate-800/30 border-slate-200 dark:border-slate-700'
            }`}>
              {isEmpty ? (
                <div className="text-center py-4">
                  <div className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400">
                    <Sparkles className="h-5 w-5" />
                    <span className="font-medium">Creating New Content</span>
                  </div>
                  <p className="text-sm text-blue-600/80 dark:text-blue-400/80 mt-2">
                    AI will generate professional {sectionType} content based on your instructions and HR insights
                  </p>
                </div>
              ) : (
                <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                  {originalContent}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Streaming Output */}
        {(isEnhancing || streamedText) && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-green-50 dark:bg-green-950/30 rounded-lg">
                <Sparkles className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">AI Response</h3>
                <p className="text-sm text-muted-foreground">
                  {isEnhancing ? 'Model is streaming...' : 'Enhancement complete'}
                </p>
              </div>
            </div>
            <pre className="whitespace-pre-wrap bg-slate-900 text-slate-50 p-4 rounded-lg h-60 overflow-y-auto">
              {streamedText || 'Model is streaming...'}
            </pre>
            {!isEnhancing && streamedText && extractEnhancedContent(streamedText) && (
              <Button 
                onClick={handleCopyEnhanced}
                className="gap-2 bg-green-600 hover:bg-green-700 text-white"
              >
                <span>Copy Enhanced Content</span>
              </Button>
            )}
          </div>
        )}

        <DialogFooter className="gap-3 pt-6 border-t">
          <Button 
            variant="outline" 
            onClick={onClose}
            className="flex-1 sm:flex-none"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleEnhance}
            disabled={isEnhancing}
            className="gap-2 flex-1 sm:flex-none bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80"
          >
            {isEnhancing ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                {isEmpty ? 'Creating with AI...' : 'Enhancing with AI...'}
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                {isEmpty ? 'Create Section' : 'Enhance Section'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}