'use client'

/**
 * PDF Generator V2 - Isolated Print Architecture
 * 
 * This is the new PDF generation system that uses an isolated iframe approach
 * to ensure pixel-perfect WYSIWYG output without any global side effects.
 * 
 * Key improvements over V1:
 * - No global style modifications
 * - Isolated rendering environment
 * - Pixel-perfect preview matching
 * - Proper font loading and preservation
 * - Better pagination support
 */

import { printPreviewToPDFWithLibraries, PrintOptions } from './isolated-print'

export interface PDFGenerationOptions extends PrintOptions {
  filename?: string
}

export class PDFGeneratorV2 {
  /**
   * Generate pixel-perfect PDF from a DOM element using isolated iframe
   * This is the recommended method for production use
   */
  static async generateFromElement(
    element: HTMLElement,
    options: PDFGenerationOptions = {}
  ): Promise<Blob> {
    console.log('🔄 Starting isolated PDF generation', options)
    
    try {
      const result = await printPreviewToPDFWithLibraries(element, options)
      
      if (!result.success || !result.blob) {
        throw new Error(result.error || 'PDF generation failed')
      }
      
      console.log('✅ PDF generated successfully')
      return result.blob
      
    } catch (error) {
      console.error('❌ PDF generation failed:', error)
      throw new Error(`PDF generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
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
      
      console.log('✅ PDF downloaded successfully')
    } catch (error) {
      console.error('❌ PDF download failed:', error)
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

  /**
   * Setup print button with isolated PDF generation
   * This is a convenience method for easy integration
   */
  static setupPrintButton(
    buttonElement: HTMLElement,
    previewElement?: HTMLElement,
    options: PDFGenerationOptions = {}
  ): void {
    const targetElement = previewElement || this.getResumePreviewElement()
    
    if (!targetElement) {
      console.error('❌ No preview element found for print button setup')
      return
    }

    buttonElement.addEventListener('click', async (e) => {
      e.preventDefault()
      
      try {
        // Show loading state
        const originalText = buttonElement.textContent
        buttonElement.setAttribute('disabled', 'true')
        buttonElement.textContent = 'Generating PDF...'
        
        // Generate and download PDF
        await this.downloadFromElement(targetElement, options)
        
        console.log('✅ Print completed successfully')
      } catch (error) {
        console.error('❌ Print failed:', error)
        alert(`Print failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      } finally {
        // Reset button state
        buttonElement.removeAttribute('disabled')
        buttonElement.textContent = originalText || 'Print to PDF'
      }
    })
  }
}

// Export the main function for direct use
export { printPreviewToPDFWithLibraries as printPreviewToPDF } from './isolated-print'
