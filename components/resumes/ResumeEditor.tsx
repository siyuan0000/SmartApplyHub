'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ResumeContent } from '@/lib/resume/parser'
import { useResumeEditor, formatAchievements, parseAchievements } from '@/hooks/useResumeEditor'
import { useAI } from '@/hooks/useAI'
import { useAboutGeneration } from '@/hooks/useAboutGeneration'
import { ResumeEditorSidebar } from './ResumeEditorSidebar'
import { useUIStore } from '@/store/ui'
import { useIsMobile } from '@/hooks/use-mobile'
import { cn } from '@/lib/utils'
import { Plus, Trash2, Sparkles, AlertCircle, RefreshCw, Wand2, Copy } from 'lucide-react'

interface ResumeEditorProps {
  resumeId: string
  onSave?: (content: ResumeContent) => void
}

export function ResumeEditor({ resumeId, onSave }: ResumeEditorProps) {
  const { 
    content, 
    loading, 
    error,
    loadResume, 
    saveResume, 
    clearError,
    updateContact,
    updateSummary,
    addExperience,
    updateExperience,
    removeExperience,
    addEducation,
    updateEducation,
    removeEducation,
    updateSkills,
    addProject,
    updateProject,
    removeProject
  } = useResumeEditor()
  
  const [activeSection, setActiveSection] = useState<string>('contact')
  const { enhanceSection, isEnhancing, error: aiError, clearError: clearAIError } = useAI()
  const { 
    generateAbout, 
    generateAboutVariations, 
    enhanceAbout,
    isGenerating, 
    isGeneratingVariations, 
    isEnhancing: isEnhancingAbout, 
    error: aboutError,
    lastResult,
    variations,
    clearError: clearAboutError,
    clearResults
  } = useAboutGeneration()
  
  const [showVariations, setShowVariations] = useState(false)
  const isMobile = useIsMobile()
  const autoCollapseTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const { 
    editorSidebarCollapsed,
    autoCollapseEditorSidebar
  } = useUIStore()

  const handleEnhanceSection = async (sectionType: string, currentContent: string) => {
    try {
      clearAIError()
      const result = await enhanceSection(sectionType, currentContent)
      
      if (content) {
        // Update the specific section with enhanced content
        switch (sectionType) {
          case 'summary':
            updateSummary(result.enhancedText)
            break
          case 'contact':
            // For contact, we might enhance the summary/headline
            break
          default:
            console.warn(`Enhancement not implemented for section: ${sectionType}`)
        }
        
        // Auto-save after AI enhancement
        await handleSave()
      }
    } catch (error) {
      console.error('Failed to enhance section:', error)
    }
  }

  useEffect(() => {
    if (resumeId) {
      loadResume(resumeId)
    }
  }, [resumeId, loadResume])

  const handleSave = async () => {
    await saveResume()
    if (content) {
      onSave?.(content)
    }
  }

  // Auto-collapse functionality for main content area
  const scheduleAutoCollapse = useCallback(() => {
    if (isMobile) return
    
    if (autoCollapseTimeoutRef.current) {
      clearTimeout(autoCollapseTimeoutRef.current)
    }
    
    autoCollapseTimeoutRef.current = setTimeout(() => {
      autoCollapseEditorSidebar()
    }, 500)
  }, [isMobile, autoCollapseEditorSidebar])

  const handleMainContentClick = useCallback(() => {
    if (!isMobile && !editorSidebarCollapsed) {
      scheduleAutoCollapse()
    }
  }, [isMobile, editorSidebarCollapsed, scheduleAutoCollapse])


  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Loading resume...</p>
      </div>
    )
  }

  if (!content) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Resume not found</p>
      </div>
    )
  }

  // About generation handlers
  const handleGenerateAbout = async () => {
    if (!content) return
    try {
      // Clear previous text and error state
      clearAboutError()
      clearResults()
      
      // Clear the current summary to show we're generating fresh content
      updateSummary('')
      
      const result = await generateAbout(content)
      if (result) {
        // Show success message for offline fallback
        if (result.provider === 'offline-fallback' || result.provider === 'local-fallback') {
          console.log('Generated offline template - customize it with your specific details')
        }
        updateSummary(result.aboutText)
        await handleSave()
      }
    } catch (error) {
      console.error('Failed to generate about:', error)
      // Show error state - the error will be displayed in the UI
    }
  }

  const handleGenerateVariations = async () => {
    if (!content) return
    try {
      clearAboutError()
      clearResults()
      setShowVariations(true)
      await generateAboutVariations(content, 3)
    } catch (error) {
      console.error('Failed to generate variations:', error)
    }
  }

  const handleEnhanceAbout = async () => {
    if (!content || !content.summary) return
    try {
      clearAboutError()
      clearResults()
      const result = await enhanceAbout(content.summary, content)
      if (result) {
        updateSummary(result.aboutText)
        await handleSave()
      }
    } catch (error) {
      console.error('Failed to enhance about:', error)
    }
  }

  const handleSelectVariation = async (variation: { aboutText: string }) => {
    updateSummary(variation.aboutText)
    setShowVariations(false)
    clearResults()
    await handleSave()
  }

  const sections = [
    { id: 'contact', label: 'Contact Info', icon: '👤' },
    { id: 'about', label: 'About Me', icon: '📝' },
    { id: 'experience', label: 'Experience', icon: '💼' },
    { id: 'education', label: 'Education', icon: '🎓' },
    { id: 'skills', label: 'Skills', icon: '🔧' },
    { id: 'projects', label: 'Projects', icon: '🚀' }
  ]

  return (
    <div className="flex h-full">
      {/* Editor Sidebar */}
      <ResumeEditorSidebar
        sections={sections}
        activeSection={activeSection}
        onSectionChange={setActiveSection}
      />
      
      {/* Main Content */}
      <div 
        className={cn(
          "flex-1 transition-all duration-300 ease-in-out",
          "overflow-y-auto"
        )}
        onClick={handleMainContentClick}
      >
        <div className="p-4 space-y-4">
          {aiError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                AI Enhancement Error: {aiError}
                <button onClick={clearAIError} className="ml-2 text-sm underline">
                  Dismiss
                </button>
              </AlertDescription>
            </Alert>
          )}
          {aboutError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                About Generation Error: {aboutError}
                <div className="mt-2 text-xs">
                  {aboutError.includes('Failed to fetch') && (
                    <p>💡 Try: Check your internet connection and API keys. The system will still generate a basic template for you.</p>
                  )}
                  {aboutError.includes('All providers failed') && (
                    <p>💡 Tip: Make sure you have set at least one API key (OPENAI_API_KEY, DEEPSEEK_API_KEY) in your environment.</p>
                  )}
                </div>
                <button onClick={clearAboutError} className="ml-2 text-sm underline">
                  Dismiss
                </button>
              </AlertDescription>
            </Alert>
          )}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {error}
                <button onClick={clearError} className="ml-2 text-sm underline">
                  Dismiss
                </button>
              </AlertDescription>
            </Alert>
          )}
          
          {/* Section Editor */}
          <div>
        {activeSection === 'contact' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>👤</span>
                Contact Information
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="ml-auto gap-1"
                  onClick={() => handleEnhanceSection('contact', `${content?.contact.name || ''} ${content?.contact.email || ''}`)}
                  disabled={isEnhancing}
                >
                  <Sparkles className="h-3 w-3" />
                  {isEnhancing ? 'Enhancing...' : 'AI Enhance'}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={content.contact.name || ''}
                    onChange={(e) => updateContact('name', e.target.value)}
                    placeholder="Enter your full name"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={content.contact.email || ''}
                    onChange={(e) => updateContact('email', e.target.value)}
                    placeholder="your.email@example.com"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={content.contact.phone || ''}
                    onChange={(e) => updateContact('phone', e.target.value)}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={content.contact.location || ''}
                    onChange={(e) => updateContact('location', e.target.value)}
                    placeholder="City, State"
                  />
                </div>
                <div>
                  <Label htmlFor="linkedin">LinkedIn</Label>
                  <Input
                    id="linkedin"
                    value={content.contact.linkedin || ''}
                    onChange={(e) => updateContact('linkedin', e.target.value)}
                    placeholder="linkedin.com/in/yourprofile"
                  />
                </div>
                <div>
                  <Label htmlFor="github">GitHub</Label>
                  <Input
                    id="github"
                    value={content.contact.github || ''}
                    onChange={(e) => updateContact('github', e.target.value)}
                    placeholder="github.com/yourusername"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {activeSection === 'about' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>📝</span>
                About Me (LinkedIn Style)
                <div className="ml-auto flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="gap-1"
                    onClick={handleGenerateAbout}
                    disabled={isGenerating || isGeneratingVariations || isEnhancingAbout}
                  >
                    <Wand2 className="h-3 w-3" />
                    {isGenerating ? 'Generating...' : 'Generate'}
                  </Button>
                  {content?.summary && (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="gap-1"
                      onClick={handleEnhanceAbout}
                      disabled={isGenerating || isGeneratingVariations || isEnhancingAbout}
                    >
                      <Sparkles className="h-3 w-3" />
                      {isEnhancingAbout ? 'Enhancing...' : 'Enhance'}
                    </Button>
                  )}
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="gap-1"
                    onClick={handleGenerateVariations}
                    disabled={isGenerating || isGeneratingVariations || isEnhancingAbout}
                  >
                    <RefreshCw className="h-3 w-3" />
                    {isGeneratingVariations ? 'Generating...' : 'Variations'}
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="about">About Section</Label>
                <Textarea
                  id="about"
                  value={content.summary || ''}
                  onChange={(e) => updateSummary(e.target.value)}
                  placeholder="Generate a professional LinkedIn-style about section using AI, or write your own compelling introduction that highlights your unique value proposition..."
                  className="min-h-32"
                />
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-muted-foreground">
                    {content?.summary ? `${content.summary.split(/\s+/).length} words` : '0 words'} 
                    {content?.summary && content.summary.length > 0 && (
                      <span className="ml-2">
                        (Recommended: 100-150 words for LinkedIn)
                      </span>
                    )}
                  </p>
                  {lastResult && (
                    <p className="text-xs text-green-600">
                      Last generated: {(() => {
                        try {
                          const generatedAt = lastResult.generatedAt instanceof Date 
                            ? lastResult.generatedAt 
                            : new Date(lastResult.generatedAt);
                          
                          // Check if the date is valid
                          if (isNaN(generatedAt.getTime())) {
                            return 'Recently';
                          }
                          
                          return generatedAt.toLocaleTimeString();
                        } catch (error) {
                          console.warn('Failed to format generatedAt:', error);
                          return 'Recently';
                        }
                      })()}
                    </p>
                  )}
                </div>
              </div>

              {/* About Generation Variations */}
              {showVariations && variations.length > 0 && (
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-sm">Choose from AI-generated variations:</h4>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => setShowVariations(false)}
                    >
                      ✕
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {variations.map((variation, index) => (
                      <div key={index} className="border rounded-lg p-3 bg-muted/30">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
                              Option {index + 1}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {variation.wordCount} words
                            </span>
                          </div>
                          <div className="flex gap-1">
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-6 w-6 p-0"
                              onClick={() => navigator.clipboard.writeText(variation.aboutText)}
                              title="Copy to clipboard"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="default" 
                              className="h-6 px-2 text-xs"
                              onClick={() => handleSelectVariation(variation)}
                            >
                              Use This
                            </Button>
                          </div>
                        </div>
                        <p className="text-sm text-foreground/80 whitespace-pre-wrap">
                          {variation.aboutText}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tips for writing About section */}
              <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-3">
                <h4 className="font-medium text-sm mb-2 text-blue-700 dark:text-blue-300">
                  💡 About Section Tips
                </h4>
                <ul className="text-xs text-blue-600 dark:text-blue-400 space-y-1">
                  <li>• Use first person perspective (&quot;I&quot; statements)</li>
                  <li>• Highlight your unique value proposition</li>
                  <li>• Include 2-3 key achievements with numbers if possible</li>
                  <li>• End with your career goals or what you&apos;re seeking</li>
                  <li>• Keep it conversational but professional</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        )}

        {activeSection === 'experience' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>💼</span>
                Work Experience
                <Button size="sm" onClick={addExperience} className="ml-auto gap-1">
                  <Plus className="h-3 w-3" />
                  Add Experience
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {content.experience.map((exp, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Experience {index + 1}</h4>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="gap-1">
                        <Sparkles className="h-3 w-3" />
                        AI Enhance
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => removeExperience(index)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <Label>Job Title</Label>
                      <Input
                        value={exp.title}
                        onChange={(e) => updateExperience(index, 'title', e.target.value)}
                        placeholder="Software Engineer"
                      />
                    </div>
                    <div>
                      <Label>Company</Label>
                      <Input
                        value={exp.company}
                        onChange={(e) => updateExperience(index, 'company', e.target.value)}
                        placeholder="Tech Company Inc."
                      />
                    </div>
                    <div>
                      <Label>Start Date</Label>
                      <Input
                        value={exp.startDate || ''}
                        onChange={(e) => updateExperience(index, 'startDate', e.target.value)}
                        placeholder="Jan 2020"
                      />
                    </div>
                    <div>
                      <Label>End Date</Label>
                      <Input
                        value={exp.endDate || ''}
                        onChange={(e) => updateExperience(index, 'endDate', e.target.value)}
                        placeholder="Present"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Role Description</Label>
                    <Input
                      value={exp.description || ''}
                      onChange={(e) => updateExperience(index, 'description', e.target.value)}
                      placeholder="Brief overview of your role"
                    />
                  </div>
                  <div>
                    <Label>Key Achievements</Label>
                    <Textarea
                      value={formatAchievements(exp.achievements)}
                      onChange={(e) => updateExperience(index, 'achievements', parseAchievements(e.target.value))}
                      placeholder="• Achievement 1&#10;• Achievement 2&#10;• Achievement 3"
                      className="min-h-32"
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {activeSection === 'education' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>🎓</span>
                Education
                <Button size="sm" onClick={addEducation} className="ml-auto gap-1">
                  <Plus className="h-3 w-3" />
                  Add Education
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {content.education.map((edu, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Education {index + 1}</h4>
                    <Button size="sm" variant="outline" onClick={() => removeEducation(index)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <Label>Degree</Label>
                      <Input
                        value={edu.degree}
                        onChange={(e) => updateEducation(index, 'degree', e.target.value)}
                        placeholder="Bachelor of Science in Computer Science"
                      />
                    </div>
                    <div>
                      <Label>School</Label>
                      <Input
                        value={edu.school}
                        onChange={(e) => updateEducation(index, 'school', e.target.value)}
                        placeholder="University Name"
                      />
                    </div>
                    <div>
                      <Label>Graduation Year</Label>
                      <Input
                        value={edu.graduationDate || ''}
                        onChange={(e) => updateEducation(index, 'graduationDate', e.target.value)}
                        placeholder="2020"
                      />
                    </div>
                    <div>
                      <Label>GPA (Optional)</Label>
                      <Input
                        value={edu.gpa || ''}
                        onChange={(e) => updateEducation(index, 'gpa', e.target.value)}
                        placeholder="3.8"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {activeSection === 'skills' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>🔧</span>
                Skills
                <Button size="sm" variant="outline" className="ml-auto gap-1">
                  <Sparkles className="h-3 w-3" />
                  AI Enhance
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Skills (comma-separated)</Label>
                <Textarea
                  value={content.skills.join(', ')}
                  onChange={(e) => updateSkills(e.target.value)}
                  placeholder="JavaScript, React, Node.js, Python, SQL, Git..."
                  className="min-h-24"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {content.skills.map((skill, index) => (
                  <Badge key={index} variant="secondary">
                    {skill}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {activeSection === 'projects' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>🚀</span>
                Projects
                <Button size="sm" onClick={addProject} className="ml-auto gap-1">
                  <Plus className="h-3 w-3" />
                  Add Project
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {(content.projects || []).map((project, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Project {index + 1}</h4>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="gap-1">
                        <Sparkles className="h-3 w-3" />
                        AI Enhance
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => removeProject(index)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <Label>Project Name</Label>
                      <Input
                        value={project.name}
                        onChange={(e) => updateProject(index, 'name', e.target.value)}
                        placeholder="Project Name"
                      />
                    </div>
                    <div>
                      <Label>Project URL</Label>
                      <Input
                        value={project.url || ''}
                        onChange={(e) => updateProject(index, 'url', e.target.value)}
                        placeholder="https://github.com/username/project"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Project Overview</Label>
                    <Input
                      value={project.description}
                      onChange={(e) => updateProject(index, 'description', e.target.value)}
                      placeholder="Brief project description"
                    />
                  </div>
                  <div>
                    <Label>Key Features/Accomplishments</Label>
                    <Textarea
                      value={formatAchievements(project.details)}
                      onChange={(e) => updateProject(index, 'details', parseAchievements(e.target.value))}
                      placeholder="• Feature 1&#10;• Feature 2&#10;• Accomplishment 3"
                      className="min-h-24"
                    />
                  </div>
                  <div>
                    <Label>Technologies Used</Label>
                    <Input
                      value={project.technologies?.join(', ') || ''}
                      onChange={(e) => updateProject(index, 'technologies', e.target.value.split(',').map(t => t.trim()).filter(t => t.length > 0))}
                      placeholder="React, Node.js, PostgreSQL"
                    />
                  </div>
                </div>
              ))}
              {(content.projects || []).length === 0 && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No projects added yet.</p>
                  <p className="text-sm text-muted-foreground">Click &quot;Add Project&quot; to get started.</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
          </div>
        </div>
      </div>
    </div>
  )
}