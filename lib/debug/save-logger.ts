/**
 * Save Pipeline Debug Logger
 * Comprehensive logging system for tracking resume save functionality
 */

export interface SaveLogEntry {
  timestamp: string
  step: string
  status: 'start' | 'success' | 'error' | 'warning'
  data?: Record<string, unknown>
  error?: string
  duration?: number
  sessionId: string
}

export interface SaveSession {
  sessionId: string
  startTime: number
  totalDuration?: number
  steps: SaveLogEntry[]
  finalStatus: 'success' | 'error' | 'unknown'
  resumeId?: string
  userId?: string
}

class SaveLogger {
  private sessions: Map<string, SaveSession> = new Map()
  private maxSessions = 50 // Keep last 50 save attempts

  generateSessionId(): string {
    return `save_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  startSession(sessionId: string, resumeId?: string, userId?: string): void {
    const session: SaveSession = {
      sessionId,
      startTime: Date.now(),
      steps: [],
      finalStatus: 'unknown',
      resumeId,
      userId
    }
    
    this.sessions.set(sessionId, session)
    this.cleanupOldSessions()
    
    console.group(`🚀 SAVE SESSION STARTED: ${sessionId}`)
    console.log('📋 Session Details:', {
      sessionId,
      resumeId: resumeId || 'unknown',
      userId: userId || 'unknown',
      timestamp: new Date().toISOString()
    })
    
    this.logStep(sessionId, 'session_start', 'start', {
      resumeId,
      userId,
      userAgent: navigator?.userAgent,
      url: window?.location?.href
    })
  }

  logStep(
    sessionId: string, 
    step: string, 
    status: 'start' | 'success' | 'error' | 'warning',
    data?: Record<string, unknown>,
    error?: string,
    startTime?: number
  ): void {
    const session = this.sessions.get(sessionId)
    if (!session) {
      console.warn(`❌ No session found for ID: ${sessionId}`)
      return
    }

    const now = Date.now()
    const duration = startTime ? now - startTime : undefined
    
    const logEntry: SaveLogEntry = {
      timestamp: new Date().toISOString(),
      step,
      status,
      data,
      error,
      duration,
      sessionId
    }

    session.steps.push(logEntry)

    // Console output with emoji indicators
    const statusEmoji = {
      start: '🔄',
      success: '✅', 
      error: '❌',
      warning: '⚠️'
    }[status]

    const stepFormatted = step.replace(/_/g, ' ').toUpperCase()
    
    if (status === 'error') {
      console.error(`${statusEmoji} [${sessionId.slice(-6)}] ${stepFormatted}`, {
        step,
        status,
        error,
        data,
        duration: duration ? `${duration}ms` : undefined,
        timestamp: logEntry.timestamp
      })
    } else if (status === 'warning') {
      console.warn(`${statusEmoji} [${sessionId.slice(-6)}] ${stepFormatted}`, {
        step,
        status,
        data,
        duration: duration ? `${duration}ms` : undefined,
        timestamp: logEntry.timestamp
      })
    } else {
      console.log(`${statusEmoji} [${sessionId.slice(-6)}] ${stepFormatted}`, {
        step,
        status,
        data,
        duration: duration ? `${duration}ms` : undefined,
        timestamp: logEntry.timestamp
      })
    }

    // Update session status
    if (status === 'error') {
      session.finalStatus = 'error'
    } else if (session.finalStatus !== 'error' && step === 'save_complete') {
      session.finalStatus = 'success'
    }
  }

  endSession(sessionId: string, finalStatus?: 'success' | 'error'): void {
    const session = this.sessions.get(sessionId)
    if (!session) {
      console.warn(`❌ No session found for ID: ${sessionId}`)
      return
    }

    const totalDuration = Date.now() - session.startTime
    session.totalDuration = totalDuration
    
    if (finalStatus) {
      session.finalStatus = finalStatus
    }

    // Final session summary
    const successSteps = session.steps.filter(s => s.status === 'success').length
    const errorSteps = session.steps.filter(s => s.status === 'error').length
    const warningSteps = session.steps.filter(s => s.status === 'warning').length

    console.log(`🏁 SAVE SESSION COMPLETED: ${sessionId}`, {
      finalStatus: session.finalStatus,
      totalDuration: `${totalDuration}ms`,
      totalSteps: session.steps.length,
      successSteps,
      errorSteps,
      warningSteps,
      resumeId: session.resumeId,
      performance: this.getPerformanceMetrics(session)
    })
    
    console.groupEnd()
    
    // Store in localStorage for debugging
    this.saveToStorage()
  }

  getSession(sessionId: string): SaveSession | undefined {
    return this.sessions.get(sessionId)
  }

  getAllSessions(): SaveSession[] {
    return Array.from(this.sessions.values())
      .sort((a, b) => b.startTime - a.startTime)
  }

  getLastSession(): SaveSession | undefined {
    const sessions = this.getAllSessions()
    return sessions[0]
  }

  private getPerformanceMetrics(session: SaveSession) {
    const stepDurations = session.steps
      .filter(s => s.duration !== undefined)
      .map(s => s.duration!)
    
    if (stepDurations.length === 0) {
      return { avgStepTime: 0, slowestStep: 'none', fastestStep: 'none' }
    }

    const avgStepTime = stepDurations.reduce((a, b) => a + b, 0) / stepDurations.length
    const slowestDuration = Math.max(...stepDurations)
    const fastestDuration = Math.min(...stepDurations)
    
    const slowestStep = session.steps.find(s => s.duration === slowestDuration)?.step || 'unknown'
    const fastestStep = session.steps.find(s => s.duration === fastestDuration)?.step || 'unknown'

    return {
      avgStepTime: Math.round(avgStepTime),
      slowestStep: `${slowestStep} (${slowestDuration}ms)`,
      fastestStep: `${fastestStep} (${fastestDuration}ms)`
    }
  }

  private cleanupOldSessions(): void {
    const sessionArray = Array.from(this.sessions.entries())
      .sort(([, a], [, b]) => b.startTime - a.startTime)
    
    if (sessionArray.length > this.maxSessions) {
      const toRemove = sessionArray.slice(this.maxSessions)
      toRemove.forEach(([sessionId]) => {
        this.sessions.delete(sessionId)
      })
    }
  }

  private saveToStorage(): void {
    try {
      const sessionsData = Array.from(this.sessions.entries()).slice(0, 10) // Keep last 10 in storage
      localStorage.setItem('resume_save_logs', JSON.stringify(sessionsData))
    } catch (error) {
      console.warn('Failed to save debug logs to localStorage:', error)
    }
  }

  loadFromStorage(): void {
    try {
      const stored = localStorage.getItem('resume_save_logs')
      if (stored) {
        const sessionsData = JSON.parse(stored) as [string, SaveSession][]
        sessionsData.forEach(([sessionId, session]) => {
          this.sessions.set(sessionId, session)
        })
      }
    } catch (error) {
      console.warn('Failed to load debug logs from localStorage:', error)
    }
  }

  // Debug helpers for console inspection
  printSessionSummary(sessionId?: string): void {
    const session = sessionId ? this.getSession(sessionId) : this.getLastSession()
    
    if (!session) {
      console.log('❌ No session found')
      return
    }

    console.group(`📊 Save Session Summary: ${session.sessionId}`)
    console.table(session.steps.map(step => ({
      Step: step.step,
      Status: step.status,
      Duration: step.duration ? `${step.duration}ms` : 'N/A',
      Error: step.error || 'None',
      Timestamp: new Date(step.timestamp).toLocaleTimeString()
    })))
    console.groupEnd()
  }

  printAllSessions(): void {
    const sessions = this.getAllSessions()
    console.group('📈 All Save Sessions')
    console.table(sessions.map(session => ({
      SessionId: session.sessionId.slice(-8),
      Status: session.finalStatus,
      Duration: session.totalDuration ? `${session.totalDuration}ms` : 'N/A',
      Steps: session.steps.length,
      Errors: session.steps.filter(s => s.status === 'error').length,
      ResumeId: session.resumeId?.slice(-8) || 'Unknown',
      StartTime: new Date(session.startTime).toLocaleString()
    })))
    console.groupEnd()
  }

  clearLogs(): void {
    this.sessions.clear()
    localStorage.removeItem('resume_save_logs')
    console.log('🧹 Save logs cleared')
  }
}

// Global singleton instance
export const saveLogger = new SaveLogger()

// Load existing logs on initialization
if (typeof window !== 'undefined') {
  saveLogger.loadFromStorage()
}

// Expose to window for debugging
if (typeof window !== 'undefined') {
  ;(window as Record<string, unknown>).saveLogger = saveLogger
  console.log('🔧 Save logger available globally as window.saveLogger')
  console.log('🔧 Try: saveLogger.printAllSessions() or saveLogger.printSessionSummary()')
}

export default saveLogger