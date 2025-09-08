/**
 * Print Integration Examples
 * 
 * This file contains examples of how to integrate the new isolated print system
 * into the resume editor components.
 */

import { PDFGeneratorV2 } from './pdf-generator-v2'
import { printPreviewToPDF, addPageBreakMarkers } from './isolated-print'

/**
 * Example 1: Basic Print Button Integration
 * 
 * This shows how to replace the existing print functionality with the new isolated approach.
 */
export function setupBasicPrintButton() {
  // Find the print button
  const printButton = document.querySelector('[data-print-button]') as HTMLElement
  const previewElement = document.querySelector('.resume-preview') as HTMLElement
  
  if (printButton && previewElement) {
    PDFGeneratorV2.setupPrintButton(printButton, previewElement, {
      pageSize: 'A4',
      margin: { top: 0.5, right: 0.5, bottom: 0.5, left: 0.5 },
      scale: 2,
      filename: 'resume.pdf'
    })
  }
}

/**
 * Example 2: Advanced Print with Custom Options
 * 
 * This shows how to use the print system with custom options and error handling.
 */
export async function advancedPrintExample() {
  const previewElement = document.querySelector('.resume-preview') as HTMLElement
  
  if (!previewElement) {
    throw new Error('Preview element not found')
  }

  try {
    // Add page break markers for better pagination
    addPageBreakMarkers(previewElement)
    
    // Generate PDF with custom options
    const result = await printPreviewToPDF(previewElement, {
      pageSize: 'Letter',
      margin: { top: 0.75, right: 0.5, bottom: 0.75, left: 0.5 },
      scale: 2.5,
      filename: 'professional_resume.pdf'
    })
    
    if (result.success && result.blob) {
      // Download the PDF
      const url = URL.createObjectURL(result.blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'professional_resume.pdf'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      console.log('✅ PDF generated and downloaded successfully')
    } else {
      throw new Error(result.error || 'PDF generation failed')
    }
  } catch (error) {
    console.error('❌ Advanced print failed:', error)
    throw error
  }
}

/**
 * Example 3: React Component Integration
 * 
 * This shows how to integrate the print functionality into a React component.
 */
export function createPrintHook() {
  return {
    printToPDF: async (previewElement: HTMLElement, options = {}) => {
      try {
        // Add page break markers
        addPageBreakMarkers(previewElement)
        
        // Generate PDF
        const result = await printPreviewToPDF(previewElement, {
          pageSize: 'A4',
          margin: { top: 0.5, right: 0.5, bottom: 0.5, left: 0.5 },
          scale: 2,
          ...options
        })
        
        if (result.success && result.blob) {
          // Download PDF
          const url = URL.createObjectURL(result.blob)
          const link = document.createElement('a')
          link.href = url
          link.download = options.filename || 'resume.pdf'
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          URL.revokeObjectURL(url)
          
          return { success: true }
        } else {
          return { success: false, error: result.error }
        }
      } catch (error) {
        return { 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        }
      }
    }
  }
}

/**
 * Example 4: Migration from Old PDF Generator
 * 
 * This shows how to migrate from the old PDFGenerator to the new V2 system.
 */
export function migrateToV2() {
  // Old code:
  // await PDFGenerator.generateResumePreviewPDF({ quality: 0.98, scale: 2 })
  
  // New code:
  return PDFGeneratorV2.generateResumePreviewPDF({
    pageSize: 'A4',
    margin: { top: 0.5, right: 0.5, bottom: 0.5, left: 0.5 },
    scale: 2,
    filename: 'resume.pdf'
  })
}

/**
 * Example 5: Custom Print Handler for Resume Editor
 * 
 * This shows how to integrate with the existing ResumeEditor component.
 */
export function createResumeEditorPrintHandler() {
  return async (content: any, resumeId: string) => {
    try {
      // Find the preview element
      const previewElement = document.querySelector('.resume-preview') as HTMLElement
      
      if (!previewElement) {
        throw new Error('Resume preview not found')
      }

      // Extract resume name for filename
      const nameElement = previewElement.querySelector('h1')
      const resumeName = nameElement?.textContent?.trim() || 'resume'
      const sanitizedName = resumeName.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '_')
      
      // Add page break markers
      addPageBreakMarkers(previewElement)
      
      // Generate PDF
      const result = await printPreviewToPDF(previewElement, {
        pageSize: 'A4',
        margin: { top: 0.5, right: 0.5, bottom: 0.5, left: 0.5 },
        scale: 2,
        filename: `${sanitizedName}_resume.pdf`
      })
      
      if (result.success && result.blob) {
        // Download PDF
        const url = URL.createObjectURL(result.blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `${sanitizedName}_resume.pdf`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
        
        return { success: true }
      } else {
        throw new Error(result.error || 'PDF generation failed')
      }
    } catch (error) {
      console.error('❌ Resume editor print failed:', error)
      throw error
    }
  }
}

/**
 * Example 6: Print Button Component
 * 
 * This shows how to create a reusable print button component.
 */
export function createPrintButtonComponent() {
  return {
    render: (container: HTMLElement, previewElement: HTMLElement, options = {}) => {
      const button = document.createElement('button')
      button.textContent = 'Print to PDF'
      button.className = 'print-button'
      button.setAttribute('data-print-button', 'true')
      
      // Setup print functionality
      PDFGeneratorV2.setupPrintButton(button, previewElement, options)
      
      // Add to container
      container.appendChild(button)
      
      return button
    }
  }
}