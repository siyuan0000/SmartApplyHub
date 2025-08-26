'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { 
  Sparkles, 
  Wand2, 
  Copy, 
  Brain,
  Target,
  Lightbulb,
  CheckCircle,
  Code,
  Zap
} from 'lucide-react'
import { ResumeContent } from '@/lib/resume/parser'
import { useToast } from '@/hooks/use-toast'
import { 
  FloatingParticles,
  PulsingIcon,
  EnhancementSteps,
  GlowingButton,
  StreamingText,
  LoadingSpinner,
  ContentPreviewCard
} from './EnhancementAnimations'
import { EnhancedContentDisplay } from './EnhancedContentDisplay'

interface AIEnhancementLabProps {
  isOpen: boolean
  onClose: () => void
  resumeContent: ResumeContent | null
  onApplyEnhancement: (sectionType: string, enhancedContent: string) => Promise<void>
  onApplyField: (fieldPath: string, value: string) => void
  activeSection?: string
  width?: number
  onResetWidth?: () => void
}

interface SectionInfo {
  type: string
  label: string
  icon: React.ReactNode
  color: string
  bgColor: string
  borderColor: string
}

const SECTIONS: SectionInfo[] = [
  {
    type: 'contact',
    label: 'Contact Info',
    icon: <Target className="h-4 w-4" />,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200'
  },
  {
    type: 'summary',
    label: 'Professional Summary',
    icon: <Brain className="h-4 w-4" />,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200'
  },
  {
    type: 'experience',
    label: 'Work Experience',
    icon: <Zap className="h-4 w-4" />,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200'
  },
  {
    type: 'education',
    label: 'Education',
    icon: <Lightbulb className="h-4 w-4" />,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200'
  },
  {
    type: 'skills',
    label: 'Skills',
    icon: <Code className="h-4 w-4" />,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-200'
  },
  {
    type: 'projects',
    label: 'Projects',
    icon: <Sparkles className="h-4 w-4" />,
    color: 'text-pink-600',
    bgColor: 'bg-pink-50',
    borderColor: 'border-pink-200'
  }
]

export function AIEnhancementLab({ 
  isOpen, 
  onClose, 
  resumeContent, 
  onApplyEnhancement,
  onApplyField,
  activeSection,
  width = 500,
  onResetWidth
}: AIEnhancementLabProps) {
  const [selectedSection, setSelectedSection] = useState<string>(activeSection || 'summary')
  const [customPrompt, setCustomPrompt] = useState('')
  const [isEnhancing, setIsEnhancing] = useState(false)
  const [analysis, setAnalysis] = useState('')
  const [enhancedContent, setEnhancedContent] = useState('')
  const [cachedResumeContext, setCachedResumeContext] = useState<string>('')
  const [enhancementStep, setEnhancementStep] = useState(0)
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false)
  const { toast } = useToast()
  const abortControllerRef = useRef<AbortController | null>(null)

  const enhancementSteps = [
    {
      icon: <Target className="h-4 w-4" />,
      label: "Analyzing Content",
      description: "AI is reviewing your current section content"
    },
    {
      icon: <Brain className="h-4 w-4" />,
      label: "Applying HR Insights",
      description: "Using professional HR expertise to identify improvements"
    },
    {
      icon: <Sparkles className="h-4 w-4" />,
      label: "Generating Enhancement",
      description: "Creating optimized content with industry best practices"
    },
    {
      icon: <CheckCircle className="h-4 w-4" />,
      label: "Enhancement Complete",
      description: "Your enhanced content is ready for review"
    }
  ]

  // Cache整个CV内容
  useEffect(() => {
    if (resumeContent && isOpen) {
      const fullContext = generateFullResumeContext(resumeContent)
      setCachedResumeContext(fullContext)
    }
  }, [resumeContent, isOpen])

  // Sync with external activeSection changes
  useEffect(() => {
    if (activeSection && activeSection !== selectedSection) {
      // Map editor sections to AI lab sections
      const sectionMapping: Record<string, string> = {
        'contact': 'contact',
        'about': 'summary',
        'experience': 'experience',
        'education': 'education',
        'skills': 'skills',
        'projects': 'projects'
      }
      
      const mappedSection = sectionMapping[activeSection] || activeSection
      setSelectedSection(mappedSection)
      
      // Clear previous enhancement results when section changes
      setAnalysis('')
      setEnhancedContent('')
      setEnhancementStep(0)
      setShowSuccessAnimation(false)
      
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [activeSection, selectedSection])

  // 重置状态当关闭时
  useEffect(() => {
    if (!isOpen) {
      setAnalysis('')
      setEnhancedContent('')
      setCustomPrompt('')
      setEnhancementStep(0)
      setShowSuccessAnimation(false)
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [isOpen])

  // Step progression during enhancement
  useEffect(() => {
    if (isEnhancing) {
      const stepInterval = setInterval(() => {
        setEnhancementStep(prev => {
          if (prev < 2) return prev + 1
          return prev
        })
      }, 1500)

      return () => clearInterval(stepInterval)
    }
  }, [isEnhancing])

  // Complete enhancement when content is received
  useEffect(() => {
    if (!isEnhancing && enhancedContent && enhancementStep < 3) {
      setEnhancementStep(3)
      setShowSuccessAnimation(true)
      setTimeout(() => setShowSuccessAnimation(false), 2000)
    }
  }, [isEnhancing, enhancedContent, enhancementStep])

  const generateFullResumeContext = (content: ResumeContent): string => {
    return `COMPLETE RESUME CONTEXT:

CONTACT INFORMATION:
Name: ${content.contact.name || 'N/A'}
Email: ${content.contact.email || 'N/A'}
Phone: ${content.contact.phone || 'N/A'}
Location: ${content.contact.location || 'N/A'}
LinkedIn: ${content.contact.linkedin || 'N/A'}
GitHub: ${content.contact.github || 'N/A'}

PROFESSIONAL SUMMARY:
${content.summary || 'Not provided'}

WORK EXPERIENCE:
${content.experience.map((exp, index) => `
${index + 1}. ${exp.title} at ${exp.company}
   ${exp.startDate || ''} - ${exp.endDate || exp.current ? 'Present' : ''}
   ${exp.location || ''}
   Description: ${exp.description || 'N/A'}
   Achievements: ${exp.achievements?.join('; ') || 'N/A'}
`).join('\n')}

EDUCATION:
${content.education.map((edu, index) => `
${index + 1}. ${edu.degree} - ${edu.school}
   Graduation: ${edu.graduationDate || 'N/A'}
   GPA: ${edu.gpa || 'N/A'}
   Honors: ${edu.honors?.join(', ') || 'N/A'}
`).join('\n')}

SKILLS:
${content.skills.join(', ')}

PROJECTS:
${(content.projects || []).map((project, index) => `
${index + 1}. ${project.name}
   Description: ${project.description}
   Technologies: ${project.technologies?.join(', ') || 'N/A'}
   Details: ${project.details?.join('; ') || 'N/A'}
   URL: ${project.url || 'N/A'}
`).join('\n')}`
  }

  const getSectionContent = (sectionType: string): string => {
    if (!resumeContent) return ''
    
    switch (sectionType) {
      case 'contact':
        return `Name: ${resumeContent.contact.name || ''}
Email: ${resumeContent.contact.email || ''}
Phone: ${resumeContent.contact.phone || ''}
Location: ${resumeContent.contact.location || ''}
LinkedIn: ${resumeContent.contact.linkedin || ''}
GitHub: ${resumeContent.contact.github || ''}`
      
      case 'summary':
        return resumeContent.summary || ''
      
      case 'experience':
        return resumeContent.experience.map((exp, index) => 
          `Experience ${index + 1}:
Title: ${exp.title}
Company: ${exp.company}
Period: ${exp.startDate || ''} - ${exp.endDate || exp.current ? 'Present' : ''}
Location: ${exp.location || ''}
Description: ${exp.description || ''}
Achievements: ${exp.achievements?.join('\n• ') || ''}`
        ).join('\n\n')
      
      case 'education':
        return resumeContent.education.map((edu, index) =>
          `Education ${index + 1}:
Degree: ${edu.degree}
School: ${edu.school}
Graduation: ${edu.graduationDate || ''}
GPA: ${edu.gpa || ''}
Honors: ${edu.honors?.join(', ') || ''}`
        ).join('\n\n')
      
      case 'skills':
        return resumeContent.skills.join(', ')
      
      case 'projects':
        return (resumeContent.projects || []).map((project, index) =>
          `Project ${index + 1}:
Name: ${project.name}
Description: ${project.description}
Technologies: ${project.technologies?.join(', ') || ''}
Details: ${project.details?.join('\n• ') || ''}
URL: ${project.url || ''}`
        ).join('\n\n')
      
      default:
        return ''
    }
  }

  const createSystemPrompt = (sectionType: string): string => {
    return `You are a professional HR expert and resume optimization specialist with over 15 years of experience in talent acquisition across Fortune 500 companies.

Your mission: Analyze and enhance the ${sectionType} section of this resume with the context of the complete CV.

PROFESSIONAL EXPERTISE:
• Deep understanding of ATS (Applicant Tracking Systems) optimization
• Expert knowledge of industry-specific keywords and trends
• Proven track record in helping candidates land interviews at top-tier companies
• Specialized in crafting compelling narratives that highlight unique value propositions

ENHANCEMENT GUIDELINES:
• Use quantifiable achievements and impact metrics whenever possible
• Incorporate industry-standard action verbs and professional terminology
• Ensure ATS compatibility with relevant keywords
• Maintain professional tone while showcasing personality and uniqueness
• Align content with modern hiring manager expectations
• Consider the whole resume context to ensure consistency and flow

FORMATTING REQUIREMENTS:
• Output PLAIN TEXT only - NO markdown formatting, NO asterisks, NO special characters
• Use simple bullet points with • character only
• Structure content to match resume editor format exactly
• Ensure proper grammar, spelling, and punctuation
• Optimize for both human readers and ATS systems
• Keep content concise yet comprehensive
• Output should be ready for direct copy-paste into resume fields

Your analysis should consider how this section fits within the candidate's overall professional narrative and career trajectory.`
  }

  const getSectionSpecificInstructions = (sectionType: string): string => {
    switch (sectionType) {
      case 'contact':
        return `CONTACT SECTION FORMAT:
Provide each contact field on a separate line:
Name: [Full Name]
Email: [Email Address]
Phone: [Phone Number]
Location: [City, State]
LinkedIn: [LinkedIn URL]
GitHub: [GitHub URL]
Website: [Website URL]`
        
      case 'summary':
        return `SUMMARY FORMAT:
Provide a concise 2-3 sentence professional summary in plain text without any formatting.`
        
      case 'experience':
        return `EXPERIENCE FORMAT:
For each experience, provide:
Title: [Job Title]
Company: [Company Name]
Start Date: [MM/YYYY]
End Date: [MM/YYYY or Present]
Location: [City, State]
Description: [Brief role description]
Achievements:
• [Achievement 1 with quantified results]
• [Achievement 2 with quantified results]
• [Achievement 3 with quantified results]`
        
      case 'education':
        return `EDUCATION FORMAT:
For each education entry, provide:
Degree: [Degree Type and Major]
School: [Institution Name]
Graduation Date: [MM/YYYY]
GPA: [GPA if relevant]
Location: [City, State]
Honors:
• [Honor 1]
• [Honor 2]`
        
      case 'skills':
        return `SKILLS FORMAT:
Provide skills as a comma-separated list:
[Skill 1], [Skill 2], [Skill 3], [Skill 4], [Skill 5]`
        
      case 'projects':
        return `PROJECTS FORMAT:
For each project, provide:
Name: [Project Name]
Description: [Brief project description]
URL: [Project URL if available]
Technologies: [Tech1, Tech2, Tech3]
Details:
• [Key feature or achievement 1]
• [Key feature or achievement 2]
• [Key feature or achievement 3]`
        
      default:
        return ''
    }
  }

  const createUserPrompt = (sectionType: string, rawContent: string, customInstructions: string): string => {
    const sectionLabel = SECTIONS.find(s => s.type === sectionType)?.label || sectionType
    const sectionSpecificInstructions = getSectionSpecificInstructions(sectionType)

    return `Please analyze and enhance the ${sectionLabel} section based on the complete resume context provided below.

SECTION TO ENHANCE: ${sectionLabel}
CURRENT CONTENT:
${rawContent || '[Empty - please create professional content from scratch]'}

${customInstructions ? `SPECIFIC ENHANCEMENT INSTRUCTIONS:
${customInstructions}

` : ''}COMPLETE RESUME CONTEXT FOR REFERENCE:
${cachedResumeContext}

${sectionSpecificInstructions}

Please provide your response in EXACTLY this format:

=== ANALYSIS ===
[Provide a detailed professional analysis of the current ${sectionLabel} section, considering:
- Current strengths and areas for improvement
- How it fits within the overall resume narrative
- ATS optimization opportunities
- Industry-specific recommendations
- Alignment with career trajectory shown in the full resume]

=== ENHANCED_CONTENT ===
[Provide the fully optimized ${sectionLabel} section in PLAIN TEXT format that matches the resume editor structure. Requirements:
- NO markdown formatting (no **, *, #, etc.)
- Use simple bullet points with • character only
- Professional and polished plain text
- ATS-optimized with relevant keywords
- Quantified with specific achievements where possible
- Consistent with the overall resume narrative
- Ready for direct copy-paste into individual resume editor fields
- Format should match the exact structure expected by the resume editor]`
  }

  const handleEnhance = async () => {
    if (!resumeContent) return

    setIsEnhancing(true)
    setAnalysis('')
    setEnhancedContent('')

    // Create new abort controller for this request
    abortControllerRef.current = new AbortController()

    try {
      const rawContent = getSectionContent(selectedSection)
      const systemPrompt = createSystemPrompt(selectedSection)
      const userPrompt = createUserPrompt(selectedSection, rawContent, customPrompt)

      const response = await fetch('/api/enhance/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sectionType: selectedSection,
          originalContent: rawContent,
          customPrompt: customPrompt,
          systemPrompt: systemPrompt,
          userPrompt: userPrompt
        }),
        signal: abortControllerRef.current.signal
      })

      if (!response.ok) {
        throw new Error(`Enhancement failed: ${response.statusText}`)
      }

      if (!response.body) {
        throw new Error('No response body')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let fullResponse = ''

      while (true) {
        const { done, value } = await reader.read()
        
        if (done) break
        
        const chunk = decoder.decode(value, { stream: true })
        fullResponse += chunk

        // Parse and update analysis and enhanced content in real-time
        const analysisMatch = fullResponse.match(/=== ANALYSIS ===\s*([\s\S]*?)(?:=== ENHANCED_CONTENT ===|$)/i)
        const enhancedMatch = fullResponse.match(/=== ENHANCED_CONTENT ===\s*([\s\S]*)$/i)

        if (analysisMatch) {
          setAnalysis(analysisMatch[1].trim())
        }
        if (enhancedMatch) {
          setEnhancedContent(enhancedMatch[1].trim())
        }
      }

    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        // Request was aborted, this is expected
        return
      }
      
      console.error('Enhancement error:', error)
      toast({
        title: "Enhancement Failed",
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: "destructive"
      })
    } finally {
      setIsEnhancing(false)
    }
  }

  const handleApplyEnhancement = async () => {
    if (enhancedContent) {
      try {
        console.log('🎯 Applying enhancement from AIEnhancementLab:', { selectedSection, contentLength: enhancedContent.length })
        await onApplyEnhancement(selectedSection, enhancedContent)
        toast({
          title: "Enhancement Applied",
          description: `Successfully applied AI enhancement to ${SECTIONS.find(s => s.type === selectedSection)?.label}`,
        })
      } catch (error) {
        console.error('❌ Failed to apply enhancement:', error)
        toast({
          title: "Enhancement Failed",
          description: `Failed to apply AI enhancement. Please try again.`,
          variant: "destructive"
        })
      }
    }
  }

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast({
        title: "Copied to Clipboard",
        description: `${type} copied successfully`,
      })
    } catch {
      toast({
        title: "Copy Failed",
        description: "Failed to copy to clipboard",
        variant: "destructive"
      })
    }
  }

  const selectedSectionInfo = SECTIONS.find(s => s.type === selectedSection)

  if (!isOpen) return null

  return (
    <div 
      className="fixed right-0 top-0 h-full bg-background border-l border-border shadow-xl z-40 overflow-hidden"
      style={{ width: `${width}px` }}
    >
      <div className="h-full flex flex-col relative">
        <FloatingParticles />
        
        {/* Header */}
        <div className="p-4 border-b relative z-10 bg-background/95 backdrop-blur">
          <div className="flex items-center justify-between">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex items-center gap-3"
            >
              <PulsingIcon
                icon={<Wand2 className="h-5 w-5" />}
                isActive={isEnhancing}
                color="purple"
              />
              <div>
                <h2 className="text-lg font-semibold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  AI Enhancement
                </h2>
                <p className="text-xs text-muted-foreground">Section Enhancement complete</p>
              </div>
            </motion.div>
            <div className="flex items-center gap-1">
              {onResetWidth && (
                <Button
                  variant="ghost" 
                  size="sm"
                  onClick={onResetWidth}
                  className="h-8 w-8 p-0"
                  title="Reset panel width"
                >
                  ⟲
                </Button>
              )}
              <Button
                variant="ghost" 
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0"
              >
                ✕
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-4 space-y-4 overflow-y-auto relative z-10">
          {/* Section Selection */}
          <motion.div 
            className="space-y-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="space-y-2">
              <h3 className="font-semibold flex items-center gap-2">
                <PulsingIcon
                  icon={selectedSectionInfo?.icon || <Target className="h-4 w-4" />}
                  isActive={true}
                  color={selectedSectionInfo?.color.split('-')[1] || 'blue'}
                />
                <motion.div
                  key={selectedSection}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  Current: {selectedSectionInfo?.label}
                </motion.div>
              </h3>
              <p className="text-sm text-muted-foreground">
                Click sections in the left editor to switch
              </p>
            </div>
          </motion.div>


          {/* Custom Instructions */}
          <motion.div 
            className="space-y-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <h4 className="font-medium flex items-center gap-2">
              <PulsingIcon
                icon={<Brain className="h-4 w-4" />}
                isActive={false}
                color="purple"
              />
              Instructions
            </h4>
            <Textarea
              placeholder="Custom enhancement instructions..."
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              className="min-h-16 text-sm resize-none"
            />
          </motion.div>

          {/* Enhancement Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <GlowingButton
              onClick={handleEnhance}
              disabled={isEnhancing || !resumeContent}
              className="w-full"
            >
              {isEnhancing ? (
                <LoadingSpinner text="Enhancing" />
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Enhance Section
                </>
              )}
            </GlowingButton>
          </motion.div>

          {/* Enhancement Steps */}
          {(isEnhancing || enhancedContent) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              transition={{ duration: 0.5 }}
            >
              <EnhancementSteps
                currentStep={enhancementStep}
                steps={enhancementSteps}
              />
            </motion.div>
          )}

          {/* Analysis Section */}
          <motion.div 
            className="space-y-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-2">
                <PulsingIcon
                  icon={<Lightbulb className="h-4 w-4" />}
                  isActive={!!analysis}
                  color="amber"
                />
                Analysis
              </h3>
              <AnimatePresence>
                {analysis && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(analysis, 'Analysis')}
                      className="gap-1 text-xs"
                    >
                      <Copy className="h-3 w-3" />
                      Copy
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            <Card className="h-40 border-2 border-dashed border-amber-200 hover:border-amber-400 transition-colors">
              <CardContent className="p-3 h-full">
                <div className="h-full overflow-y-auto">
                  <AnimatePresence mode="wait">
                    {analysis ? (
                      <motion.div 
                        className="text-xs leading-relaxed text-muted-foreground"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        key="analysis-content"
                      >
                        <StreamingText text={analysis} isStreaming={false} />
                      </motion.div>
                    ) : (
                      <motion.div 
                        className="flex items-center justify-center h-full text-center"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        key="analysis-placeholder"
                      >
                        <div className="space-y-2">
                          <Brain className="h-6 w-6 text-muted-foreground mx-auto" />
                          <p className="text-xs text-muted-foreground">
                            Analysis will appear here
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Enhanced Content Section */}
          <motion.div 
            className="space-y-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-2">
                <PulsingIcon
                  icon={<CheckCircle className="h-4 w-4" />}
                  isActive={!!enhancedContent}
                  color="green"
                />
                Enhanced Content
              </h3>
              <div className="flex gap-2">
                <AnimatePresence>
                  {enhancedContent && (
                    <>
                      <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(enhancedContent, 'Enhanced content')}
                          className="gap-1 text-xs"
                        >
                          <Copy className="h-3 w-3" />
                          Copy
                        </Button>
                      </motion.div>
                      <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ delay: 0.1 }}
                      >
                        <GlowingButton
                          onClick={handleApplyEnhancement}
                          className="gap-1 text-xs px-3 py-2"
                          glowColor="green"
                        >
                          <CheckCircle className="h-3 w-3" />
                          Copy Enhanced Content
                        </GlowingButton>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            </div>
            
            <ContentPreviewCard isHighlighted={!!enhancedContent || (isEnhancing && enhancementStep >= 2)}>
              <div className="relative">
                {showSuccessAnimation && (
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-green-400/20 to-emerald-400/20 rounded-lg z-10"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 1.5, opacity: 0 }}
                    transition={{ duration: 0.5 }}
                  />
                )}
                
                <CardContent className="p-3 max-h-96 overflow-y-auto">
                  <AnimatePresence mode="wait">
                    {enhancedContent ? (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        key="enhanced-content"
                        className="relative z-20"
                      >
                        <EnhancedContentDisplay
                          sectionType={selectedSection}
                          enhancedContent={enhancedContent}
                          onApplyField={onApplyField}
                          originalContent={resumeContent}
                        />
                      </motion.div>
                    ) : isEnhancing && enhancementStep >= 2 ? (
                      <motion.div 
                        className="flex items-center justify-center h-32"
                        key="enhanced-thinking"
                      >
                        <div className="text-center space-y-3">
                          <motion.div
                            className="flex justify-center"
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ duration: 1, repeat: Infinity }}
                          >
                            <Sparkles className="h-6 w-6 text-green-500" />
                          </motion.div>
                          <p className="text-xs text-muted-foreground">Generating enhanced content...</p>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div 
                        className="flex items-center justify-center h-32 text-center"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        key="enhanced-placeholder"
                      >
                        <div className="space-y-2">
                          <motion.div
                            animate={{ 
                              scale: [1, 1.2, 1],
                              rotate: [0, 360]
                            }}
                            transition={{ 
                              scale: { duration: 1.5, repeat: Infinity },
                              rotate: { duration: 3, repeat: Infinity, ease: "linear" }
                            }}
                          >
                            <Sparkles className="h-6 w-6 text-muted-foreground mx-auto" />
                          </motion.div>
                          <p className="text-xs text-muted-foreground">
                            Enhanced content will appear here
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </div>
            </ContentPreviewCard>
          </motion.div>
        </div>
      </div>
    </div>
  )
}