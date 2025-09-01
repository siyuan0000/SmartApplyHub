'use client'

/**
 * PDF Generation utility for resume preview
 * Uses html2canvas and jsPDF to convert the resume preview to PDF
 */

import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

export interface PDFGenerationOptions {
  filename?: string
  quality?: number
  scale?: number
  margin?: number
}

/**
 * Preprocesses an element to fix issues with html2canvas
 * Converts modern CSS color functions that html2canvas doesn't support
 */
function preprocessElementForPDF(element: HTMLElement): void {
  console.log('🔧 Preprocessing element for PDF compatibility')
  
  // Comprehensive color function regex patterns
  const colorFunctionRegex = /(oklch|oklab|lch|lab|hwb|color)\([^)]+\)/gi
  
  // Fallback color mappings for specific values
  const colorFallbacks: Record<string, string> = {
    'oklch(': '#000000',
    'oklab(': '#000000', 
    'lch(': '#000000',
    'lab(': '#000000',
    'hwb(': '#000000',
    'color(': '#000000'
  }
  
  // Create a comprehensive CSS override style
  const overrideStyle = document.createElement('style')
  overrideStyle.setAttribute('data-pdf-override', 'true')
  
  // Generate unique ID for this element if it doesn't have one
  if (!element.id) {
    element.id = `pdf-element-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }
  
  overrideStyle.textContent = `
    /* Reset all color functions to safe values */
    #${element.id} *, 
    #${element.id} *:before,
    #${element.id} *:after {
      background: inherit !important;
      color: inherit !important;
      border-color: #cccccc !important;
    }
    
    /* Reset body and root colors */
    #${element.id} {
      background: white !important;
      color: black !important;
      font-family: system-ui, -apple-system, sans-serif !important;
    }
    
    /* Reset all Tailwind color classes */
    #${element.id} [class*="bg-"]:not([class*="bg-white"]):not([class*="bg-transparent"]) {
      background-color: white !important;
    }
    
    #${element.id} [class*="text-"]:not([class*="text-black"]):not([class*="text-inherit"]) {
      color: black !important;
    }
    
    #${element.id} [class*="border-"]:not([class*="border-transparent"]) {
      border-color: #cccccc !important;
    }
    
    /* Reset gradients */
    #${element.id} [class*="gradient"] {
      background: white !important;
      background-image: none !important;
    }
    
    /* Headers and emphasis */
    #${element.id} h1, #${element.id} h2, #${element.id} h3, 
    #${element.id} h4, #${element.id} h5, #${element.id} h6 {
      color: #000000 !important;
      font-weight: bold !important;
    }
    
    #${element.id} strong, #${element.id} b {
      color: #000000 !important;
      font-weight: bold !important;
    }
    
    /* Links and interactive elements */
    #${element.id} a {
      color: #000000 !important;
      text-decoration: none !important;
    }
    
    /* Remove all shadows and effects */
    #${element.id} * {
      box-shadow: none !important;
      text-shadow: none !important;
      filter: none !important;
      backdrop-filter: none !important;
    }
  `
  
  // Process all elements recursively to override inline styles
  const processElement = (el: HTMLElement) => {
    try {
      // Get all inline styles
      const inlineStyle = el.getAttribute('style') || ''
      
      // Replace color functions in inline styles
      if (inlineStyle && colorFunctionRegex.test(inlineStyle)) {
        console.log('🎨 Found problematic inline styles:', inlineStyle)
        const cleanedStyle = inlineStyle.replace(colorFunctionRegex, (match) => {
          const funcName = match.split('(')[0] + '('
          return colorFallbacks[funcName] || '#000000'
        })
        el.setAttribute('style', cleanedStyle)
      }
      
      // Override computed styles that might have color functions
      const computedStyle = window.getComputedStyle(el)
      
      // Force override background colors
      if (computedStyle.backgroundColor && colorFunctionRegex.test(computedStyle.backgroundColor)) {
        el.style.backgroundColor = 'white'
      }
      
      // Force override text colors  
      if (computedStyle.color && colorFunctionRegex.test(computedStyle.color)) {
        el.style.color = 'black'
      }
      
      // Force override border colors
      if (computedStyle.borderColor && colorFunctionRegex.test(computedStyle.borderColor)) {
        el.style.borderColor = '#cccccc'
      }
      
      // Remove CSS custom properties that might contain color functions
      const styleDeclaration = el.style
      for (let i = styleDeclaration.length - 1; i >= 0; i--) {
        const property = styleDeclaration[i]
        const value = styleDeclaration.getPropertyValue(property)
        if (property.startsWith('--') || colorFunctionRegex.test(value)) {
          el.style.removeProperty(property)
        }
      }
      
    } catch (err) {
      // Silently handle any style processing errors
      console.warn('Style processing error:', err)
    }
    
    // Process children
    Array.from(el.children).forEach(child => {
      if (child instanceof HTMLElement) {
        processElement(child)
      }
    })
  }
  
  // Apply the override styles first
  element.appendChild(overrideStyle)
  
  // Then process all elements
  processElement(element)
  
  console.log('✅ Element preprocessing completed with comprehensive color override')
}

export class PDFGenerator {
  /**
   * Generate PDF from a DOM element (specifically the resume preview)
   */
  static async generateFromElement(
    element: HTMLElement,
    options: PDFGenerationOptions = {}
  ): Promise<Blob> {
    const {
      quality = 0.98,
      scale = 2,
      margin = 0.5
    } = options

    try {
      console.log('🔄 Starting PDF generation from element:', element.className)
      
      // Pre-process the element to handle modern CSS color functions
      const elementClone = element.cloneNode(true) as HTMLElement
      preprocessElementForPDF(elementClone)
      
      // Temporarily append the clone to the document for processing
      elementClone.style.position = 'absolute'
      elementClone.style.left = '-9999px'
      elementClone.style.top = '-9999px'
      document.body.appendChild(elementClone)
      
      try {
        // Configure html2canvas options for high quality output
        const canvas = await html2canvas(elementClone, {
          scale,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          removeContainer: true,
          logging: false,
          height: elementClone.scrollHeight || element.scrollHeight,
          width: elementClone.scrollWidth || element.scrollWidth,
          ignoreElements: (el) => {
            // Ignore interactive elements and UI chrome
            return el.classList.contains('no-print') ||
                   el.tagName === 'BUTTON' ||
                   el.classList.contains('absolute') ||
                   el.classList.contains('fixed') ||
                   el.getAttribute('role') === 'button'
          },
          onclone: (clonedDoc, clonedElement) => {
            // Additional processing for the cloned document
            console.log('🔄 Processing cloned document for PDF generation')
            preprocessElementForPDF(clonedElement)
          }
        })
        
        console.log('✅ Canvas generated successfully:', { width: canvas.width, height: canvas.height })
        
        // A4 dimensions in mm
        const a4Width = 210
        const a4Height = 297
        const marginInMm = margin * 25.4 // Convert inches to mm
        const contentWidth = a4Width - (marginInMm * 2)
        const contentHeight = a4Height - (marginInMm * 2)

        // Calculate scaling to fit content within A4
        const canvasRatio = canvas.width / canvas.height
        const pageRatio = contentWidth / contentHeight
        
        let imgWidth, imgHeight
        if (canvasRatio > pageRatio) {
          // Canvas is wider, scale by width
          imgWidth = contentWidth
          imgHeight = contentWidth / canvasRatio
        } else {
          // Canvas is taller, scale by height
          imgHeight = contentHeight
          imgWidth = contentHeight * canvasRatio
        }

        console.log('📐 PDF dimensions calculated:', { 
          canvasRatio, 
          pageRatio, 
          imgWidth, 
          imgHeight,
          contentWidth,
          contentHeight
        })

        // Create PDF
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4'
        })

        // Convert canvas to image
        const imgData = canvas.toDataURL('image/png', quality)
        console.log('🖼️ Canvas converted to image data URL')
        
        // Center the image on the page
        const xOffset = marginInMm + (contentWidth - imgWidth) / 2
        const yOffset = marginInMm + (contentHeight - imgHeight) / 2
        
        // Add image to PDF
        pdf.addImage(
          imgData,
          'PNG',
          xOffset,
          yOffset,
          imgWidth,
          imgHeight
        )

        console.log('✅ PDF generated successfully')
        // Return as Blob
        return pdf.output('blob')
      } finally {
        // Clean up the temporary clone
        document.body.removeChild(elementClone)
      }
    } catch (error) {
      console.error('PDF generation failed:', error)
      
      let errorMessage = 'Failed to generate PDF. Please try again.'
      
      // Provide more specific error messages based on error type
      if (error instanceof Error) {
        if (error.message.includes('oklch') || error.message.includes('color')) {
          errorMessage = 'PDF generation failed due to unsupported color formats. Please try again.'
        } else if (error.message.includes('canvas') || error.message.includes('html2canvas')) {
          errorMessage = 'Failed to capture content for PDF. Please ensure the content is visible and try again.'
        } else if (error.message.includes('jsPDF') || error.message.includes('addImage')) {
          errorMessage = 'PDF creation failed. Please try again or contact support.'
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMessage = 'Network error during PDF generation. Please check your connection and try again.'
        } else if (error.message.includes('memory') || error.message.includes('quota')) {
          errorMessage = 'Insufficient memory for PDF generation. Try reducing content complexity.'
        }
      }
      
      // Log detailed error for debugging
      console.error('PDF Generation Error Details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        elementId: element.id,
        elementClass: element.className,
        timestamp: new Date().toISOString()
      })
      
      throw new Error(errorMessage)
    }
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