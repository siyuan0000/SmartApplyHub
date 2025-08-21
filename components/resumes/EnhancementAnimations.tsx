'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Sparkles, CheckCircle } from 'lucide-react'

interface ParticleProps {
  x: number
  y: number
  id: number
}

export function FloatingParticles() {
  const [particles, setParticles] = useState<ParticleProps[]>([])

  useEffect(() => {
    const newParticles = Array.from({ length: 20 }, (_, i) => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      id: i
    }))
    setParticles(newParticles)
  }, [])

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute w-1 h-1 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full opacity-30"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
          }}
          animate={{
            y: [0, -20, 0],
            x: [0, 10, 0],
            opacity: [0.3, 0.8, 0.3],
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 2,
          }}
        />
      ))}
    </div>
  )
}

interface TypewriterTextProps {
  text: string
  speed?: number
  onComplete?: () => void
}

export function TypewriterText({ text, speed = 50, onComplete }: TypewriterTextProps) {
  const [displayText, setDisplayText] = useState('')
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    if (currentIndex < text.length) {
      const timer = setTimeout(() => {
        setDisplayText(text.slice(0, currentIndex + 1))
        setCurrentIndex(currentIndex + 1)
      }, speed)
      return () => clearTimeout(timer)
    } else if (onComplete) {
      onComplete()
    }
  }, [currentIndex, text, speed, onComplete])

  return (
    <span className="relative">
      {displayText}
      {currentIndex < text.length && (
        <motion.span
          className="inline-block w-0.5 h-4 bg-current ml-0.5"
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.8, repeat: Infinity }}
        />
      )}
    </span>
  )
}

interface PulsingIconProps {
  icon: React.ReactNode
  isActive: boolean
  color?: string
}

export function PulsingIcon({ icon, isActive, color = "purple" }: PulsingIconProps) {
  return (
    <motion.div
      className={cn(
        "p-2 rounded-xl relative",
        isActive ? `bg-${color}-500` : `bg-${color}-100`
      )}
      animate={isActive ? {
        scale: [1, 1.1, 1],
        boxShadow: [
          `0 0 0 0 rgb(147 51 234 / 0.7)`,
          `0 0 0 10px rgb(147 51 234 / 0)`,
          `0 0 0 0 rgb(147 51 234 / 0)`
        ]
      } : {}}
      transition={{ duration: 2, repeat: isActive ? Infinity : 0 }}
    >
      <motion.div
        className={isActive ? "text-white" : `text-${color}-600`}
        animate={isActive ? { rotate: [0, 5, -5, 0] } : {}}
        transition={{ duration: 1, repeat: isActive ? Infinity : 0 }}
      >
        {icon}
      </motion.div>
    </motion.div>
  )
}

interface EnhancementStepsProps {
  currentStep: number
  steps: Array<{
    icon: React.ReactNode
    label: string
    description: string
  }>
}

export function EnhancementSteps({ currentStep, steps }: EnhancementStepsProps) {
  return (
    <div className="space-y-4">
      {steps.map((step, index) => (
        <motion.div
          key={index}
          className={cn(
            "flex items-center gap-4 p-3 rounded-lg transition-all duration-300",
            index === currentStep 
              ? "bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200" 
              : index < currentStep
              ? "bg-green-50 border border-green-200"
              : "bg-gray-50 border border-gray-200"
          )}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <PulsingIcon
            icon={step.icon}
            isActive={index === currentStep}
            color={index < currentStep ? "green" : index === currentStep ? "purple" : "gray"}
          />
          
          <div className="flex-1">
            <h4 className={cn(
              "font-medium",
              index === currentStep ? "text-purple-700" : 
              index < currentStep ? "text-green-700" : "text-gray-600"
            )}>
              {step.label}
            </h4>
            <p className={cn(
              "text-sm",
              index === currentStep ? "text-purple-600" : 
              index < currentStep ? "text-green-600" : "text-gray-500"
            )}>
              {step.description}
            </p>
          </div>

          {index < currentStep && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="text-green-600"
            >
              <CheckCircle className="h-5 w-5" />
            </motion.div>
          )}
        </motion.div>
      ))}
    </div>
  )
}

interface GlowingButtonProps {
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  className?: string
  glowColor?: string
}

export function GlowingButton({ 
  children, 
  onClick, 
  disabled, 
  className,
  glowColor = "purple"
}: GlowingButtonProps) {
  return (
    <motion.button
      className={cn(
        "relative px-6 py-3 rounded-lg font-medium text-white overflow-hidden",
        disabled 
          ? "bg-gray-400 cursor-not-allowed" 
          : `bg-gradient-to-r from-${glowColor}-500 to-pink-500 hover:from-${glowColor}-600 hover:to-pink-600`,
        className
      )}
      onClick={onClick}
      disabled={disabled}
      whileHover={!disabled ? { scale: 1.02 } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
      animate={!disabled ? {
        boxShadow: [
          `0 0 20px rgb(147 51 234 / 0.3)`,
          `0 0 30px rgb(147 51 234 / 0.5)`,
          `0 0 20px rgb(147 51 234 / 0.3)`
        ]
      } : {}}
      transition={{ duration: 2, repeat: Infinity }}
    >
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent"
        animate={!disabled ? {
          x: ['-100%', '100%']
        } : {}}
        transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
      />
      <span className="relative z-10">{children}</span>
    </motion.button>
  )
}

interface StreamingTextProps {
  text: string
  isStreaming: boolean
}

export function StreamingText({ text, isStreaming }: StreamingTextProps) {
  const [displayedText, setDisplayedText] = useState('')
  
  useEffect(() => {
    if (!isStreaming) {
      setDisplayedText(text)
      return
    }
    
    let currentIndex = 0
    const interval = setInterval(() => {
      if (currentIndex < text.length) {
        setDisplayedText(text.slice(0, currentIndex + 1))
        currentIndex++
      } else {
        clearInterval(interval)
      }
    }, 10) // Fast streaming effect
    
    return () => clearInterval(interval)
  }, [text, isStreaming])
  
  return (
    <div className="relative">
      <AnimatePresence mode="wait">
        <motion.div
          key={isStreaming ? 'streaming' : 'static'}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="whitespace-pre-wrap"
        >
          {isStreaming ? displayedText : text}
        </motion.div>
      </AnimatePresence>
      
      {isStreaming && (
        <motion.div
          className="inline-block w-2 h-4 bg-gradient-to-b from-purple-500 to-pink-500 ml-1 rounded-sm"
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
    </div>
  )
}

interface SectionSelectorProps {
  sections: Array<{
    type: string
    label: string
    icon: React.ReactNode
    color: string
    bgColor: string
  }>
  selectedSection: string
  onSectionChange: (section: string) => void
}

export function AnimatedSectionSelector({ 
  sections, 
  selectedSection, 
  onSectionChange 
}: SectionSelectorProps) {
  return (
    <div className="space-y-2">
      {sections.map((section, index) => (
        <motion.button
          key={section.type}
          className={cn(
            "w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200 text-left",
            selectedSection === section.type
              ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg"
              : `hover:${section.bgColor} border border-transparent hover:border-gray-200`
          )}
          onClick={() => onSectionChange(section.type)}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.05 }}
          whileHover={{ x: 4 }}
          whileTap={{ scale: 0.98 }}
        >
          <motion.div
            className={cn(
              "p-2 rounded-lg",
              selectedSection === section.type ? "bg-white/20" : section.bgColor
            )}
            animate={selectedSection === section.type ? {
              rotate: [0, 5, -5, 0]
            } : {}}
            transition={{ duration: 1, repeat: selectedSection === section.type ? Infinity : 0 }}
          >
            {section.icon}
          </motion.div>
          
          <div className="flex-1">
            <div className="font-medium">{section.label}</div>
            <div className={cn(
              "text-xs opacity-75",
              selectedSection === section.type ? "text-white/80" : "text-gray-500"
            )}>
              Click to enhance
            </div>
          </div>

          {selectedSection === section.type && (
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              className="text-white"
            >
              <Sparkles className="h-4 w-4" />
            </motion.div>
          )}
        </motion.button>
      ))}
    </div>
  )
}

interface LoadingSpinnerProps {
  text?: string
  color?: string
}

export function LoadingSpinner({ text = "Processing", color = "purple" }: LoadingSpinnerProps) {
  return (
    <div className="flex items-center justify-center space-x-3">
      <motion.div
        className={`w-8 h-8 border-4 border-${color}-200 border-t-${color}-500 rounded-full`}
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      />
      <TypewriterText text={text + "..."} speed={100} />
    </div>
  )
}

// New animation components for enhanced effects
export function AIThinkingAnimation() {
  return (
    <motion.div 
      className="flex items-center justify-center space-x-2 py-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div 
        className="flex space-x-1"
        animate={{ 
          scale: [1, 1.1, 1],
        }}
        transition={{ 
          duration: 1.5, 
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-2 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full"
            animate={{
              y: [0, -8, 0],
              opacity: [0.4, 1, 0.4]
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              delay: i * 0.2,
              ease: "easeInOut"
            }}
          />
        ))}
      </motion.div>
      <motion.div
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.5 }}
        className="text-sm text-muted-foreground"
      >
        AI is thinking...
      </motion.div>
    </motion.div>
  )
}

export function ContentPreviewCard({ children, isHighlighted = false }: { 
  children: React.ReactNode
  isHighlighted?: boolean 
}) {
  return (
    <motion.div
      className={cn(
        "relative overflow-hidden rounded-lg border-2 transition-all duration-300",
        isHighlighted 
          ? "border-purple-300 bg-gradient-to-br from-purple-50 to-pink-50 shadow-lg" 
          : "border-gray-200 bg-background hover:border-gray-300"
      )}
      whileHover={{ y: -2 }}
      animate={isHighlighted ? {
        boxShadow: [
          "0 0 0 0 rgba(147, 51, 234, 0.4)",
          "0 0 0 8px rgba(147, 51, 234, 0.1)",
          "0 0 0 0 rgba(147, 51, 234, 0.4)"
        ]
      } : {}}
      transition={{ 
        boxShadow: { duration: 2, repeat: Infinity },
        y: { duration: 0.2 }
      }}
    >
      {isHighlighted && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-transparent to-pink-500/10"
          animate={{
            background: [
              "linear-gradient(90deg, rgba(147,51,234,0.1) 0%, transparent 50%, rgba(236,72,153,0.1) 100%)",
              "linear-gradient(90deg, rgba(236,72,153,0.1) 0%, transparent 50%, rgba(147,51,234,0.1) 100%)"
            ]
          }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
      {children}
    </motion.div>
  )
}

export function SectionTransition({ children, sectionKey }: { 
  children: React.ReactNode
  sectionKey: string 
}) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={sectionKey}
        initial={{ opacity: 0, x: 20, scale: 0.95 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        exit={{ opacity: 0, x: -20, scale: 0.95 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}