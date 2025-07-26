'use client'

import { useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { 
  ChevronLeft, 
  ChevronRight, 
  X, 
  CheckCircle
} from 'lucide-react'
import { useApplicationWorkflowStore } from '@/store/application-workflow'
import { JobSelectionStep } from './JobSelectionStep'
import { ResumeSelectionStep } from './ResumeSelectionStep'
import { EmailGenerationStep } from './EmailGenerationStep'
import { ApplicationSubmissionStep } from './ApplicationSubmissionStep'

export function ApplicationWorkflowModal() {
  const {
    isOpen,
    currentStep,
    steps,
    canProceedToNext,
    isSubmittingApplication,
    error,
    closeWorkflow,
    resetWorkflow,
    nextStep,
    prevStep,
    getCurrentStepData,
    getProgress,
    clearError,
    loadFromSession
  } = useApplicationWorkflowStore()

  // Load from session storage when modal opens
  useEffect(() => {
    if (isOpen) {
      loadFromSession()
    }
  }, [isOpen, loadFromSession])

  // Clear error when step changes
  useEffect(() => {
    clearError()
  }, [currentStep, clearError])

  const currentStepData = getCurrentStepData()
  const progress = getProgress()
  const isLastStep = currentStep === steps.length - 1
  const isFirstStep = currentStep === 0

  const handleClose = () => {
    if (!isSubmittingApplication) {
      closeWorkflow()
    }
  }

  const handleReset = () => {
    if (!isSubmittingApplication) {
      resetWorkflow()
    }
  }

  const renderCurrentStep = () => {
    switch (currentStepData.id) {
      case 'job-selection':
        return <JobSelectionStep />
      case 'resume-selection':
        return <ResumeSelectionStep />
      case 'email-generation':
        return <EmailGenerationStep />
      case 'submission':
        return <ApplicationSubmissionStep />
      default:
        return <div>Unknown step</div>
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-[95vw] lg:w-[90vw] lg:max-w-[1400px] max-h-[90vh] overflow-y-auto p-0 gap-0 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb:hover]:bg-muted-foreground/30 scroll-smooth" showCloseButton={false}>
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <DialogTitle className="text-xl font-semibold">
                New Job Application
              </DialogTitle>
              <div className="text-sm text-muted-foreground">
                Step {currentStep + 1} of {steps.length}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              disabled={isSubmittingApplication}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">
                Progress
              </span>
              <span className="text-sm font-medium text-muted-foreground">
                {Math.round(progress)}%
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </DialogHeader>

        {/* Step Navigation */}
        <div className="px-6 py-4 border-b bg-gradient-to-r from-slate-50 to-gray-50">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center flex-1">
                <div
                  className={`flex items-center space-x-2 ${
                    index === currentStep
                      ? 'text-blue-600 font-medium'
                      : step.completed
                      ? 'text-green-600'
                      : 'text-muted-foreground'
                  }`}
                >
                  <div className={`relative flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                    step.completed 
                      ? 'bg-green-100 border-green-500' 
                      : index === currentStep 
                      ? 'bg-blue-100 border-blue-500' 
                      : 'bg-gray-100 border-gray-300'
                  }`}>
                    {step.completed ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <span className={`text-xs font-bold ${
                        index === currentStep ? 'text-blue-600' : 'text-gray-500'
                      }`}>
                        {index + 1}
                      </span>
                    )}
                  </div>
                  <div className="hidden sm:block">
                    <div className={`text-sm font-medium ${
                      index === currentStep 
                        ? 'text-blue-600' 
                        : step.completed 
                        ? 'text-green-600' 
                        : 'text-muted-foreground'
                    }`}>
                      {step.title}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {step.description}
                    </div>
                  </div>
                </div>
                {/* Connection Line */}
                {index < steps.length - 1 && (
                  <div className={`flex-1 h-px mx-4 ${
                    step.completed ? 'bg-green-300' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-6 py-6">
            {/* Current Step Header */}
            <div className="mb-6 pb-4 border-b border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 border-2 border-blue-500">
                  <span className="text-sm font-bold text-blue-600">
                    {currentStep + 1}
                  </span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-foreground">
                    {currentStepData.title}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {currentStepData.description}
                  </p>
                </div>
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start space-x-3">
                  <div className="text-red-600 text-sm font-medium">
                    Error: {error}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearError}
                    className="text-red-600 hover:text-red-700 ml-auto"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step Content */}
            <div className="min-h-[400px]">
              {renderCurrentStep()}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-gradient-to-r from-gray-50 to-slate-50 shadow-lg">
          <div className="flex items-center justify-between">
            {/* Left side */}
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={isFirstStep || isSubmittingApplication}
                className="text-sm font-medium shadow-sm hover:shadow-md transition-shadow"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
              <Button
                variant="ghost"
                onClick={handleReset}
                disabled={isSubmittingApplication}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Reset
              </Button>
            </div>

            {/* Right side */}
            <div className="flex items-center space-x-4">
              <div className="text-xs text-muted-foreground hidden sm:flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                <span>{currentStep + 1} of {steps.length} steps</span>
              </div>
              <Button
                onClick={nextStep}
                disabled={!canProceedToNext() || isSubmittingApplication}
                className="text-sm font-medium bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-md hover:shadow-lg transition-all"
              >
                {isLastStep ? 'Submit Application' : 'Continue'}
                {!isLastStep && <ChevronRight className="h-4 w-4 ml-1" />}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}