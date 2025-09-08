'use client'

/**
 * PDF Generation utility for resume preview
 * Uses html2canvas and jsPDF to convert the resume preview to PDF
 */

import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { printPreviewToPDFWithLibraries } from './isolated-print'

export interface PDFGenerationOptions {
  filename?: string
  quality?: number
  scale?: number
  margin?: number
  // When true, match PDF page size to preview element size
  alignToPreview?: boolean
}

/**
 * Creates a pixel-perfect clone of the resume preview for PDF generation
 * Preserves exact visual appearance while using safe CSS values
 */
function createPixelPerfectCloneForPDF(element: HTMLElement): HTMLElement {
  console.log('🔧 Creating pixel-perfect clone for PDF generation')
  
  // Clone the entire element structure with deep copy
  const clone = element.cloneNode(true) as HTMLElement
  
  // Preserve the exact preview styling by copying all computed styles
  copyComputedStylesToClone(element, clone)
  
  // Apply minimal sanitization to only fix color function issues while preserving appearance
  const cleanup = sanitizeColorFunctionsOnly(clone)
  
  // Store cleanup function on the clone for later use
  ;(clone as HTMLElement & { cleanup: () => void }).cleanup = cleanup
  
  return clone
}

/**
 * Copy computed styles from original element to clone to preserve exact appearance
 */
function copyComputedStylesToClone(original: HTMLElement, clone: HTMLElement): void {
  console.log('🎨 Copying computed styles to preserve preview appearance')
  
  // Copy styles from the main element
  const originalStyles = window.getComputedStyle(original)
  applyComputedStyleToElement(originalStyles, clone)
  
  // Recursively copy styles for all child elements
  const originalChildren = original.querySelectorAll('*')
  const cloneChildren = clone.querySelectorAll('*')
  
  for (let i = 0; i < originalChildren.length && i < cloneChildren.length; i++) {
    const originalChild = originalChildren[i] as HTMLElement
    const cloneChild = cloneChildren[i] as HTMLElement
    
    if (originalChild && cloneChild) {
      const childStyles = window.getComputedStyle(originalChild)
      applyComputedStyleToElement(childStyles, cloneChild)
    }
  }
}

/**
 * Apply computed styles to an element while preserving layout and appearance
 */
function applyComputedStyleToElement(computedStyle: CSSStyleDeclaration, element: HTMLElement): void {
  // Critical style properties that must be preserved for identical appearance
  const criticalProperties = [
    'font-family', 'font-size', 'font-weight', 'line-height', 'letter-spacing',
    'color', 'background-color', 'background-image', 'background-size', 'background-position',
    'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
    'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
    'border', 'border-width', 'border-style', 'border-color',
    'border-top', 'border-right', 'border-bottom', 'border-left',
    'border-radius', 'box-shadow', 'text-shadow',
    'display', 'position', 'top', 'right', 'bottom', 'left',
    'width', 'height', 'min-width', 'min-height', 'max-width', 'max-height',
    'flex', 'flex-direction', 'flex-wrap', 'justify-content', 'align-items', 'align-content',
    'gap', 'text-align', 'vertical-align', 'text-decoration', 'text-transform',
    'list-style', 'list-style-type', 'list-style-position', 'opacity', 'visibility',
    'overflow', 'overflow-x', 'overflow-y', 'white-space', 'word-wrap', 'word-break'
  ]
  
  criticalProperties.forEach(property => {
    const value = computedStyle.getPropertyValue(property)
    if (value && value !== 'initial' && value !== 'inherit') {
      element.style.setProperty(property, value, 'important')
    }
  })
}

/**
 * Minimal sanitization to only fix color function issues while preserving all original styling
 */
function sanitizeColorFunctionsOnly(element: HTMLElement): () => void {
  console.log('🔧 Applying minimal color function sanitization')
  
  // Function to replace problematic color functions in CSS text with better color approximations
  const sanitizeCSSText = (cssText: string): string => {
    // More intelligent color replacements that try to preserve the original intent
    const sanitized = cssText
      // Replace oklch colors with appropriate RGB equivalents
      .replace(/oklch\(0\.9[^)]*\)/gi, 'rgb(229, 231, 235)')    // Light gray
      .replace(/oklch\(0\.8[^)]*\)/gi, 'rgb(156, 163, 175)')    // Medium-light gray  
      .replace(/oklch\(0\.6[^)]*\)/gi, 'rgb(75, 85, 99)')       // Medium gray
      .replace(/oklch\(0\.4[^)]*\)/gi, 'rgb(55, 65, 81)')       // Dark gray
      .replace(/oklch\(0\.2[^)]*\)/gi, 'rgb(17, 24, 39)')       // Very dark gray
      .replace(/oklch\([^)]+\)/gi, 'rgb(107, 114, 128)')        // Default gray for other oklch
      
      // Replace blue oklch colors
      .replace(/oklch\([^)]*blue[^)]*\)/gi, 'rgb(59, 130, 246)') // Blue-500
      .replace(/oklch\([^)]*0\.7[^)]*0\.15[^)]*240[^)]*\)/gi, 'rgb(37, 99, 235)') // Blue-600
      
      // Replace other color functions with safe defaults
      .replace(/lch\([^)]+\)/gi, 'rgb(107, 114, 128)')          // Default gray
      .replace(/oklab\([^)]+\)/gi, 'rgb(107, 114, 128)')        // Default gray
      .replace(/lab\([^)]+\)/gi, 'rgb(107, 114, 128)')          // Default gray
      .replace(/hwb\([^)]+\)/gi, 'rgb(107, 114, 128)')          // Default gray
      .replace(/color-mix\([^)]+\)/gi, 'rgb(107, 114, 128)')    // Default gray
      .replace(/color\([^)]+\)/gi, 'rgb(107, 114, 128)')        // Default gray
    
    return sanitized
  }
  
  // Create a comprehensive style override that preserves the original appearance
  const createComprehensiveSafetyCSS = () => {
    const safetyStyle = document.createElement('style')
    safetyStyle.setAttribute('data-pdf-safety', 'true')
    safetyStyle.textContent = `
      /* Comprehensive CSS to ensure PDF matches preview exactly */
      
      /* Reset problematic color functions only */
      * {
        font-family: inherit;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      
      /* Preserve Tailwind text colors with safe equivalents */
      .text-gray-900 { color: rgb(17, 24, 39) !important; }
      .text-gray-800 { color: rgb(31, 41, 55) !important; }
      .text-gray-700 { color: rgb(55, 65, 81) !important; }
      .text-gray-600 { color: rgb(75, 85, 99) !important; }
      .text-gray-500 { color: rgb(107, 114, 128) !important; }
      .text-blue-600 { color: rgb(37, 99, 235) !important; }
      .text-blue-500 { color: rgb(59, 130, 246) !important; }
      
      /* Preserve Tailwind background colors */
      .bg-white { background-color: rgb(255, 255, 255) !important; }
      .bg-gray-50 { background-color: rgb(249, 250, 251) !important; }
      .bg-blue-50 { background-color: rgb(239, 246, 255) !important; }
      
      /* Preserve Tailwind border colors */
      .border-gray-200 { border-color: rgb(229, 231, 235) !important; }
      .border-blue-200 { border-color: rgb(191, 219, 254) !important; }
      .border-l-2 { border-left-width: 2px !important; border-left-style: solid !important; }
      .border-b { border-bottom-width: 1px !important; border-bottom-style: solid !important; }
      
      /* Typography styling to match preview */
      .text-3xl { font-size: 1.875rem !important; line-height: 2.25rem !important; }
      .text-lg { font-size: 1.125rem !important; line-height: 1.75rem !important; }
      .text-base { font-size: 1rem !important; line-height: 1.5rem !important; }
      .text-sm { font-size: 0.875rem !important; line-height: 1.25rem !important; }
      .text-xs { font-size: 0.75rem !important; line-height: 1rem !important; }
      
      .font-bold { font-weight: 700 !important; }
      .font-semibold { font-weight: 600 !important; }
      .font-medium { font-weight: 500 !important; }
      
      /* Spacing to match preview */
      .mb-2 { margin-bottom: 0.5rem !important; }
      .mb-4 { margin-bottom: 1rem !important; }
      .mb-6 { margin-bottom: 1.5rem !important; }
      .pb-1 { padding-bottom: 0.25rem !important; }
      .pb-6 { padding-bottom: 1.5rem !important; }
      .pl-3 { padding-left: 0.75rem !important; }
      .p-6 { padding: 1.5rem !important; }
      
      /* Layout classes */
      .text-center { text-align: center !important; }
      .flex { display: flex !important; }
      .flex-wrap { flex-wrap: wrap !important; }
      .justify-center { justify-content: center !important; }
      .items-center { align-items: center !important; }
      .space-y-4 > * + * { margin-top: 1rem !important; }
      .space-y-0\.5 > * + * { margin-top: 0.125rem !important; }
      .gap-1 { gap: 0.25rem !important; }
      .gap-4 { gap: 1rem !important; }
      
      /* List styling */
      .list-disc { list-style-type: disc !important; }
      .list-inside { list-style-position: inside !important; }
    `
    document.head.appendChild(safetyStyle)
    return safetyStyle
  }

  // Process all elements recursively
  const processElement = (el: HTMLElement) => {
    // Only sanitize the style attribute if it contains problematic color functions
    if (el.style && el.style.cssText) {
      const originalCss = el.style.cssText
      const sanitizedCss = sanitizeCSSText(originalCss)
      
      if (originalCss !== sanitizedCss) {
        el.style.cssText = sanitizedCss
        console.log(`🔧 Sanitized color functions in element: ${el.tagName}`)
      }
    }
    
    // Process inline styles in case they contain color functions
    const inlineStyle = el.getAttribute('style')
    if (inlineStyle) {
      const sanitizedStyle = sanitizeCSSText(inlineStyle)
      if (inlineStyle !== sanitizedStyle) {
        el.setAttribute('style', sanitizedStyle)
      }
    }
  }
  
  // Add comprehensive safety CSS
  const safetyStyle = createComprehensiveSafetyCSS()
  
  try {
    // Process the main element and all descendants
    processElement(element)
    const allElements = element.querySelectorAll('*')
    allElements.forEach(el => {
      if (el instanceof HTMLElement) {
        processElement(el)
      }
    })
    
    console.log('✅ Color function sanitization completed')
    
    // Return cleanup function
    return () => {
      if (safetyStyle.parentNode) {
        safetyStyle.parentNode.removeChild(safetyStyle)
      }
    }
  } catch (error) {
    console.warn('Color function sanitization failed:', error)
    // Clean up on error
    if (safetyStyle.parentNode) {
      safetyStyle.parentNode.removeChild(safetyStyle)
    }
    return () => {} // Return no-op cleanup function
  }
}

/**
 * Fallback function to create a canvas with text content when html2canvas fails
 */
async function createTextBasedCanvas(element: HTMLElement): Promise<HTMLCanvasElement> {
  console.log('🔄 Creating text-based canvas fallback')
  
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  
  if (!ctx) {
    throw new Error('Cannot get canvas context for text-based fallback')
  }
  
  // Set canvas size to A4 proportions (at 150dpi)
  canvas.width = 1240  // 8.27" * 150dpi
  canvas.height = 1754 // 11.69" * 150dpi
  
  // Set white background
  ctx.fillStyle = 'white'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  
  // Extract text content from element
  const textContent = extractTextContent(element)
  
  // Set font and text properties
  ctx.fillStyle = 'black'
  ctx.font = '16px Arial, sans-serif'
  
  // Draw text line by line
  let y = 50
  const lineHeight = 20
  const maxWidth = canvas.width - 100 // 50px margin on each side
  
  textContent.forEach(line => {
    if (y > canvas.height - 50) return // Stop if we reach bottom margin
    
    // Word wrap long lines
    const words = line.split(' ')
    let currentLine = ''
    
    words.forEach(word => {
      const testLine = currentLine + (currentLine ? ' ' : '') + word
      const metrics = ctx.measureText(testLine)
      
      if (metrics.width > maxWidth && currentLine) {
        // Draw current line and start new one
        ctx.fillText(currentLine, 50, y)
        y += lineHeight
        currentLine = word
      } else {
        currentLine = testLine
      }
    })
    
    // Draw remaining text
    if (currentLine) {
      ctx.fillText(currentLine, 50, y)
      y += lineHeight
    }
  })
  
  console.log('✅ Text-based canvas created successfully')
  return canvas
}

/**
 * Extract plain text content from HTML element
 */
function extractTextContent(element: HTMLElement): string[] {
  const lines: string[] = []
  
  function processNode(node: Node) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent?.trim()
      if (text) {
        lines.push(text)
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const elem = node as HTMLElement
      
      // Add spacing for block elements
      if (['DIV', 'P', 'H1', 'H2', 'H3', 'BR'].includes(elem.tagName)) {
        lines.push('')
      }
      
      // Process child nodes
      Array.from(node.childNodes).forEach(processNode)
    }
  }
  
  processNode(element)
  return lines.filter(line => line.trim().length > 0)
}

export class PDFGenerator {
  /**
   * Generate pixel-perfect PDF from a DOM element
   * Uses the new isolated print approach for better reliability
   */
  static async generateFromElement(
    element: HTMLElement,
    options: PDFGenerationOptions = {}
  ): Promise<Blob> {
    const { quality = 1.0, scale = 3 } = options

    try {
      console.log('🔄 Starting PDF generation with isolated approach')
      
      // Use the new isolated print approach for better reliability
      const result = await printPreviewToPDFWithLibraries(element, {
        pageSize: 'A4',
        margin: { top: 0.5, right: 0.5, bottom: 0.5, left: 0.5 },
        scale: scale,
        filename: options.filename || 'resume.pdf',
        alignToPreview: options.alignToPreview === true
      })
      
      if (!result.success || !result.blob) {
        throw new Error(result.error || 'PDF generation failed')
      }
      
      console.log('✅ PDF generated successfully with isolated approach')
      return result.blob
      
    } catch (error) {
      console.error('❌ Isolated PDF generation failed, falling back to legacy method:', error)
      
      // Fallback to the original method if isolated approach fails
      return this.generateFromElementLegacy(element, options)
    }
  }

  /**
   * Legacy PDF generation method (kept as fallback)
   * This is the original implementation that may cause global style changes
   */
  private static async generateFromElementLegacy(
    element: HTMLElement,
    options: PDFGenerationOptions = {}
  ): Promise<Blob> {
    const { quality = 1.0, scale = 3 } = options

    try {
      console.log('🔄 Starting legacy PDF generation (fallback)')
      
      // 1. FONT PRESERVATION: Ensure all fonts are loaded before cloning
      await document.fonts.ready
      console.log('✅ All fonts loaded and ready')
      
      // 2. CREATE STYLE-PRESERVING CLONE
      const renderingClone = await this.createRenderingClone(element)
      
      try {
        // 3. CONFIGURE html2canvas FOR MAXIMUM FIDELITY
        const canvas = await html2canvas(renderingClone, {
          // High-quality settings
          scale: scale,                    // 3x scale for crisp text
          useCORS: true,
          allowTaint: true,
          
          // Exact dimensions to prevent scaling issues
          width: renderingClone.offsetWidth,
          height: renderingClone.offsetHeight,
          
          // Color and background preservation¬
          backgroundColor: window.getComputedStyle(element).backgroundColor || '#ffffff',
          
          // Advanced rendering options
          foreignObjectRendering: true,    // Better SVG/complex element support
          removeContainer: false,         // Keep container structure
          logging: false,
          
          // Font and text optimization
          // letterRendering: true,          // Optimize letter rendering (not supported in current version)
          
          onclone: async (clonedDoc, clonedElement) => {
            console.log('🔧 Applying font preservation to cloned document')
            
            // Wait for fonts in the cloned document
            if (clonedDoc.fonts) {
              await clonedDoc.fonts.ready
            }
            
            // Inject font preservation CSS
            const fontCSS = document.createElement('style')
            fontCSS.textContent = `
              * {
                -webkit-font-smoothing: antialiased !important;
                -moz-osx-font-smoothing: grayscale !important;
                text-rendering: optimizeLegibility !important;
                font-feature-settings: "kern" 1 !important;
                font-variant-ligatures: common-ligatures !important;
              }
            `
            clonedDoc.head.appendChild(fontCSS)
            
            // Copy all original stylesheets to cloned document
            const originalSheets = Array.from(document.styleSheets)
            for (const sheet of originalSheets) {
              try {
                const clonedStyle = document.createElement('style')
                const rules = Array.from(sheet.cssRules || sheet.rules || [])
                clonedStyle.textContent = rules.map(rule => rule.cssText).join('\n')
                clonedDoc.head.appendChild(clonedStyle)
              } catch (e) {
                console.warn('Could not clone stylesheet:', e)
              }
            }
          },
          
          // Element filtering
          ignoreElements: (el) => {
            const element = el as HTMLElement
            return element.classList?.contains('no-print') ||
                   element.tagName === 'BUTTON' ||
                   element.getAttribute('role') === 'button' ||
                   (element.style.position === 'absolute' && element.classList.contains('no-print'))
          }
        })
        
        console.log('✅ Canvas generated:', { width: canvas.width, height: canvas.height })
        
        // 4. CREATE PDF WITH EXACT ASPECT RATIO
        const pdf = this.createOptimalPDF(canvas, quality)
        
        return pdf.output('blob')
        
      } finally {
        // Cleanup the rendering clone
        if (renderingClone.parentNode) {
          renderingClone.parentNode.removeChild(renderingClone)
        }
      }
      
    } catch (error) {
      console.error('PDF generation failed:', error)
      throw new Error(`PDF generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Create a rendering clone that preserves all visual styles
   */
  private static async createRenderingClone(element: HTMLElement): Promise<HTMLElement> {
    // Deep clone the element
    const clone = element.cloneNode(true) as HTMLElement
    
    // Apply color function sanitization while preserving appearance
    const cleanup = sanitizeColorFunctionsOnly(clone)
    ;(clone as any).cleanup = cleanup
    
    // Get original computed styles
    const originalRect = element.getBoundingClientRect()
    const computedStyles = window.getComputedStyle(element)
    
    // Position clone off-screen for rendering
    clone.style.position = 'absolute'
    clone.style.left = '-99999px'
    clone.style.top = '-99999px'
    clone.style.visibility = 'hidden'
    clone.style.pointerEvents = 'none'
    clone.style.zIndex = '-9999'
    
    // Preserve exact dimensions and styling
    clone.style.width = `${originalRect.width}px`
    clone.style.height = `${originalRect.height}px`
    clone.style.minHeight = computedStyles.minHeight
    clone.style.maxHeight = computedStyles.maxHeight
    clone.style.overflow = 'visible'
    clone.style.margin = '0'
    clone.style.padding = computedStyles.padding
    clone.style.boxSizing = computedStyles.boxSizing
    clone.style.backgroundColor = computedStyles.backgroundColor || '#ffffff'
    
    // Preserve typography exactly
    clone.style.fontFamily = computedStyles.fontFamily
    clone.style.fontSize = computedStyles.fontSize
    clone.style.fontWeight = computedStyles.fontWeight
    clone.style.lineHeight = computedStyles.lineHeight
    clone.style.letterSpacing = computedStyles.letterSpacing
    clone.style.color = computedStyles.color
    
    // Apply advanced font rendering
    ;(clone.style as any).webkitFontSmoothing = 'antialiased'
    ;(clone.style as any).mozOsxFontSmoothing = 'grayscale'
    ;(clone.style as any).textRendering = 'optimizeLegibility'
    
    // Recursively preserve child element styles
    this.preserveChildStyles(element, clone)
    
    // Append to document for rendering
    document.body.appendChild(clone)
    
    // Force layout recalculation and font loading
    clone.offsetHeight
    await new Promise(resolve => requestAnimationFrame(resolve))
    
    return clone
  }

  /**
   * Recursively preserve styles for all child elements
   */
  private static preserveChildStyles(original: HTMLElement, clone: HTMLElement): void {
    const originalChildren = Array.from(original.querySelectorAll('*'))
    const cloneChildren = Array.from(clone.querySelectorAll('*'))
    
    for (let i = 0; i < Math.min(originalChildren.length, cloneChildren.length); i++) {
      const originalChild = originalChildren[i] as HTMLElement
      const cloneChild = cloneChildren[i] as HTMLElement
      
      if (originalChild && cloneChild) {
        const styles = window.getComputedStyle(originalChild)
        
        // Critical properties for visual fidelity
        const criticalProps = [
          'font-family', 'font-size', 'font-weight', 'line-height', 'letter-spacing',
          'color', 'background-color', 'border', 'margin', 'padding', 'text-align',
          'display', 'flex', 'justify-content', 'align-items', 'gap', 'position',
          'width', 'height', 'min-width', 'max-width', 'min-height', 'max-height'
        ]
        
        criticalProps.forEach(prop => {
          const value = styles.getPropertyValue(prop)
          if (value && value !== 'initial' && value !== 'inherit') {
            cloneChild.style.setProperty(prop, value, 'important')
          }
        })
      }
    }
  }

  /**
   * Create PDF with optimal scaling and positioning
   */
  private static createOptimalPDF(canvas: HTMLCanvasElement, quality: number): jsPDF {
    // A4 dimensions with professional margins
    const a4Width = 210   // mm
    const a4Height = 297  // mm
    const margin = 15     // mm (professional margins)
    const contentWidth = a4Width - (margin * 2)
    const contentHeight = a4Height - (margin * 2)
    
    // Calculate optimal scaling while preserving aspect ratio
    const canvasRatio = canvas.width / canvas.height
    const pageRatio = contentWidth / contentHeight
    
    let imgWidth, imgHeight
    
    if (canvasRatio > pageRatio) {
      // Fit to page width
      imgWidth = contentWidth
      imgHeight = contentWidth / canvasRatio
    } else {
      // Fit to page height
      imgHeight = contentHeight  
      imgWidth = contentHeight * canvasRatio
    }
    
    // Create PDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
      precision: 16
    })
    
    // Convert canvas to high-quality image
    const imgData = canvas.toDataURL('image/png', quality)
    
    // Center the content on the page
    const xOffset = margin + (contentWidth - imgWidth) / 2
    const yOffset = margin + (contentHeight - imgHeight) / 2
    
    // Add image with exact dimensions
    pdf.addImage(imgData, 'PNG', xOffset, yOffset, imgWidth, imgHeight, undefined, 'FAST')
    
    return pdf
  }

  /**
   * Generate and download PDF from a DOM element
   */
  static async downloadFromElement(
    element: HTMLElement,
    options: PDFGenerationOptions = {}
  ): Promise<void> {
    const { filename = 'resume.pdf' } = options
    
    try {
      const blob = await this.generateFromElement(element, options)
      
      // Create download link
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      
      // Trigger download
      document.body.appendChild(link)
      link.click()
      
      // Cleanup
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('PDF download failed:', error)
      throw error
    }
  }

  /**
   * Get the resume preview element from the DOM
   */
  static getResumePreviewElement(): HTMLElement | null {
    // Look for the resume content container (not the whole preview which includes UI)
    const contentElement = document.querySelector('.resume-content')
    if (contentElement) {
      return contentElement as HTMLElement
    }
    
    // Fallback to the resume preview container
    const previewElement = document.querySelector('.resume-preview')
    return previewElement as HTMLElement
  }

  /**
   * Generate PDF from the current resume preview
   */
  static async generateResumePreviewPDF(
    options: PDFGenerationOptions = {}
  ): Promise<void> {
    const previewElement = this.getResumePreviewElement()
    
    if (!previewElement) {
      throw new Error('Resume preview not found. Please ensure the preview is visible.')
    }

    // Extract resume name for filename if available
    const nameElement = previewElement.querySelector('h1')
    const resumeName = nameElement?.textContent?.trim() || 'resume'
    const sanitizedName = resumeName.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '_')
    
    const finalOptions = {
      filename: `${sanitizedName}_resume.pdf`,
      ...options
    }

    await this.downloadFromElement(previewElement, finalOptions)
  }
}