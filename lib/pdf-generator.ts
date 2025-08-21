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
      // Configure html2canvas options for high quality output
      const canvas = await html2canvas(element, {
        scale,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        removeContainer: true,
        logging: false,
        height: element.scrollHeight,
        width: element.scrollWidth,
        ignoreElements: (element) => {
          // Ignore interactive elements and UI chrome
          return element.classList.contains('no-print') ||
                 element.tagName === 'BUTTON' ||
                 element.classList.contains('absolute') ||
                 element.classList.contains('fixed') ||
                 element.getAttribute('role') === 'button'
        }
      })

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

      // Create PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      })

      // Convert canvas to image
      const imgData = canvas.toDataURL('image/png', quality)
      
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

      // Return as Blob
      return pdf.output('blob')
    } catch (error) {
      console.error('PDF generation failed:', error)
      throw new Error('Failed to generate PDF. Please try again.')
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