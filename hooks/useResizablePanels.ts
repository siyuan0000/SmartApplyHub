import { useState, useCallback, useRef, useEffect } from 'react'

interface UseResizablePanelsProps {
  minWidth?: number
  maxWidth?: number
  defaultWidth?: number
  storageKey?: string
}

export function useResizablePanels({
  minWidth = 300,
  maxWidth = 800,
  defaultWidth = 500,
  storageKey = 'resizable-panel-width'
}: UseResizablePanelsProps = {}) {
  const [width, setWidth] = useState(() => {
    if (typeof window !== 'undefined' && storageKey) {
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        const parsedWidth = parseInt(saved, 10)
        return Math.max(minWidth, Math.min(maxWidth, parsedWidth))
      }
    }
    return defaultWidth
  })

  const [isResizing, setIsResizing] = useState(false)
  const startPosRef = useRef<number>(0)
  const startWidthRef = useRef<number>(0)

  // Save to localStorage when width changes
  useEffect(() => {
    if (typeof window !== 'undefined' && storageKey) {
      localStorage.setItem(storageKey, width.toString())
    }
  }, [width, storageKey])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizing(true)
    startPosRef.current = e.clientX
    startWidthRef.current = width
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }, [width])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return

    const deltaX = startPosRef.current - e.clientX
    const newWidth = Math.max(
      minWidth,
      Math.min(maxWidth, startWidthRef.current + deltaX)
    )
    setWidth(newWidth)
  }, [isResizing, minWidth, maxWidth])

  const handleMouseUp = useCallback(() => {
    setIsResizing(false)
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
  }, [])

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isResizing, handleMouseMove, handleMouseUp])

  const resetWidth = useCallback(() => {
    setWidth(defaultWidth)
  }, [defaultWidth])

  return {
    width,
    isResizing,
    handleMouseDown,
    resetWidth,
    setWidth
  }
}