/**
 * Print Integration Snippet for ResumeEditor
 * 
 * This file contains the exact code changes needed to integrate the new
 * isolated print system into the existing ResumeEditor component.
 */

import { PDFGeneratorV2 } from './pdf-generator-v2'
import { addPageBreakMarkers } from './isolated-print'

/**
 * Updated print handler for ResumeEditor component
 * 
 * Replace the existing handlePrint function in ResumeEditor.tsx with this:
 */
export const updatedHandlePrint = async (content: any, isDirty: boolean, handleSave: () => Promise<void>) => {
  if (!content) {
    console.warn('No content to print')
    return
  }

  try {
    // Show loading toast
    console.log('🖨️ Starting PDF generation process')

    // First, save the current content to ensure we have the latest data
    if (isDirty) {
      console.log('📝 Saving current changes before PDF generation')
      await handleSave()
    }

    // Get the preview element
    const previewElement = document.querySelector('.resume-preview') as HTMLElement
    if (!previewElement) {
      throw new Error('Resume preview not found. Please ensure the preview is visible.')
    }

    // Add page break markers for better pagination
    addPageBreakMarkers(previewElement)

    // Extract resume name for filename
    const nameElement = previewElement.querySelector('h1')
    const resumeName = nameElement?.textContent?.trim() || 'resume'
    const sanitizedName = resumeName.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '_')

    // Generate PDF using the new isolated approach
    await PDFGeneratorV2.generateResumePreviewPDF({
      pageSize: 'A4',
      margin: { top: 0.5, right: 0.5, bottom: 0.5, left: 0.5 },
      scale: 2,
      filename: `${sanitizedName}_resume.pdf`
    })

    console.log('✅ PDF generated successfully')
  } catch (error) {
    console.error('❌ PDF generation failed:', error)
    throw error
  }
}

/**
 * Alternative: Direct integration with existing print button
 * 
 * Add this to the ResumeEditor component's useEffect or component mount:
 */
export const setupPrintButtonIntegration = () => {
  // Find the existing print button
  const printButton = document.querySelector('[data-testid="print-button"]') as HTMLElement
  const previewElement = document.querySelector('.resume-preview') as HTMLElement

  if (printButton && previewElement) {
    // Remove existing event listeners
    const newButton = printButton.cloneNode(true) as HTMLElement
    printButton.parentNode?.replaceChild(newButton, printButton)

    // Setup new print functionality
    PDFGeneratorV2.setupPrintButton(newButton, previewElement, {
      pageSize: 'A4',
      margin: { top: 0.5, right: 0.5, bottom: 0.5, left: 0.5 },
      scale: 2,
      filename: 'resume.pdf'
    })
  }
}

/**
 * React Hook for Print Functionality
 * 
 * Use this hook in your React components:
 */
export const usePrintToPDF = () => {
  const printToPDF = async (options = {}) => {
    try {
      const previewElement = document.querySelector('.resume-preview') as HTMLElement
      
      if (!previewElement) {
        throw new Error('Resume preview not found')
      }

      // Add page break markers
      addPageBreakMarkers(previewElement)

      // Generate PDF
      await PDFGeneratorV2.generateResumePreviewPDF({
        pageSize: 'A4',
        margin: { top: 0.5, right: 0.5, bottom: 0.5, left: 0.5 },
        scale: 2,
        ...options
      })

      return { success: true }
    } catch (error) {
      console.error('Print failed:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  return { printToPDF }
}

/**
 * Complete ResumeEditor Integration
 * 
 * Here's the complete code to replace the existing print functionality:
 */
export const completeResumeEditorIntegration = `
// In ResumeEditor.tsx, replace the existing handlePrint function with:

const handlePrint = async () => {
  if (!content) {
    console.warn('No content to print')
    toast.error('No content to print')
    return
  }

  try {
    // Show loading toast
    toast.loading('Generating PDF...', { id: 'pdf-generation' })
    console.log('🖨️ Starting PDF generation process')

    // First, save the current content to ensure we have the latest data
    if (isDirty) {
      console.log('📝 Saving current changes before PDF generation')
      await handleSave(true)
    }

    // Get the preview element
    const previewElement = document.querySelector('.resume-preview') as HTMLElement
    if (!previewElement) {
      throw new Error('Resume preview not found. Please ensure the preview is visible.')
    }

    // Add page break markers for better pagination
    addPageBreakMarkers(previewElement)

    // Extract resume name for filename
    const nameElement = previewElement.querySelector('h1')
    const resumeName = nameElement?.textContent?.trim() || 'resume'
    const sanitizedName = resumeName.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '_')

    // Generate PDF using the new isolated approach
    await PDFGeneratorV2.generateResumePreviewPDF({
      pageSize: 'A4',
      margin: { top: 0.5, right: 0.5, bottom: 0.5, left: 0.5 },
      scale: 2,
      filename: \`\${sanitizedName}_resume.pdf\`
    })

    toast.success('PDF generated successfully!', { id: 'pdf-generation' })
    console.log('✅ PDF generated successfully')
  } catch (error) {
    console.error('❌ PDF generation failed:', error)
    toast.error(
      error instanceof Error 
        ? error.message 
        : 'Failed to generate PDF. Please try again.',
      { id: 'pdf-generation' }
    )
  }
}

// Add these imports at the top of ResumeEditor.tsx:
import { PDFGeneratorV2 } from '@/lib/pdf-generator-v2'
import { addPageBreakMarkers } from '@/lib/isolated-print'
`
