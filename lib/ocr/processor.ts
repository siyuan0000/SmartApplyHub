import Tesseract from 'tesseract.js'
import * as mammoth from 'mammoth'

export interface OCRResult {
  text: string
  confidence: number
}

// Type guard to check if an item has a str property
function isTextItem(item: unknown): item is { str: string } {
  return typeof item === 'object' && item !== null && 'str' in item && typeof (item as { str: unknown }).str === 'string'
}

export class OCRProcessor {
  private static worker: Tesseract.Worker | null = null

  static async initializeWorker(): Promise<void> {
    if (this.worker) return

    this.worker = await Tesseract.createWorker('eng')
  }

  static async validatePageCount(file: File): Promise<void> {
    if (file.type === 'application/pdf') {
      const pageCount = await this.getPDFPageCount(file)
      if (pageCount > 1) {
        throw new Error(`Your resume has ${pageCount} pages. Please upload a 1-page resume only. Multi-page resumes should be condensed to a single page for optimal ATS compatibility.`)
      }
    }
    // For DOCX/DOC files, we'll rely on size limits as proxy for page count
    // since determining exact page count requires complex layout calculations
    if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
        file.type === 'application/msword') {
      // Typical 1-page resume with normal formatting is under 500KB
      // This is a reasonable heuristic for page count validation
      if (file.size > 750 * 1024) { // 750KB limit for Word docs
        throw new Error('Your document appears to be quite large. Please ensure it\'s a 1-page resume only. Multi-page resumes should be condensed to a single page for optimal ATS compatibility.')
      }
    }
  }

  private static async getPDFPageCount(file: File): Promise<number> {
    try {
      if (typeof window === 'undefined') {
        throw new Error('PDF page count detection only available in browser environment')
      }

      const pdfjsLib = await import('pdfjs-dist')
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`

      const arrayBuffer = await file.arrayBuffer()
      const typedArray = new Uint8Array(arrayBuffer)
      
      const loadingTask = pdfjsLib.getDocument({ data: typedArray })
      const pdf = await loadingTask.promise
      
      return pdf.numPages
    } catch (error) {
      console.warn('Failed to get PDF page count:', error)
      // If we can't determine page count, allow processing but log warning
      return 1
    }
  }

  static async processFile(file: File): Promise<OCRResult> {
    // Validate file before processing
    if (!file || file.size === 0) {
      throw new Error('Invalid file: File is empty or corrupted')
    }

    if (file.size > 10 * 1024 * 1024) {
      throw new Error('File too large: Maximum file size is 10MB')
    }

    // Validate page count for 1-page requirement
    await this.validatePageCount(file)

    try {
      if (file.type === 'application/pdf') {
        return await this.processPDF(file)
      } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        return await this.processDocx(file)
      } else if (file.type === 'application/msword') {
        return await this.processDoc(file)
      } else if (file.type.startsWith('image/')) {
        return await this.processImage(file)
      } else {
        throw new Error(`Unsupported file type: ${file.type}. Only PDF, DOCX, DOC, and image files are supported.`)
      }
    } catch (error) {
      // Preserve the original error message if it's already descriptive
      if (error instanceof Error && error.message.includes('processing failed:')) {
        throw error
      }
      
      // Add context based on file type
      const fileTypeContext = this.getFileTypeContext(file.type)
      throw new Error(`${fileTypeContext} processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private static getFileTypeContext(fileType: string): string {
    if (fileType === 'application/pdf') {
      return 'PDF'
    } else if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      return 'DOCX'
    } else if (fileType === 'application/msword') {
      return 'DOC'
    } else if (fileType.startsWith('image/')) {
      return 'Image OCR'
    }
    return 'File'
  }

  private static async processPDF(file: File): Promise<OCRResult> {
    // For PDF files, we'll first try to extract text using pdf-parse
    // If that fails, we'll convert to image and use OCR
    try {
      const text = await this.extractPDFTextWithLibrary(file)
      if (text.trim().length > 10) { // Reasonable threshold for meaningful text
        return { text, confidence: 1.0 }
      }
    } catch (error) {
      console.log('PDF text extraction with pdf-parse failed:', error)
    }

    // Fallback to basic text extraction for edge cases
    try {
      const text = await this.extractPDFTextBasic(file)
      if (text.trim().length > 10) {
        return { text, confidence: 0.9 }
      }
    } catch (error) {
      console.log('Basic PDF text extraction failed:', error)
    }

    // Final fallback to OCR for image-based PDFs
    console.log('PDF text extraction failed, falling back to OCR')
    return await this.processImage(file)
  }

  private static async extractPDFTextWithLibrary(file: File): Promise<string> {
    // Dynamic import to avoid SSR issues
    if (typeof window === 'undefined') {
      throw new Error('PDF.js extraction only available in browser environment')
    }

    try {
      const pdfjsLib = await import('pdfjs-dist')
      
      // Set up the worker for pdfjs-dist
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`

      const arrayBuffer = await file.arrayBuffer()
      const typedArray = new Uint8Array(arrayBuffer)
      
      const loadingTask = pdfjsLib.getDocument({ data: typedArray })
      const pdf = await loadingTask.promise
      
      // Extract text from first page only (1-page resume requirement)
      const page = await pdf.getPage(1)
      const textContent = await page.getTextContent()
      
      const fullText = textContent.items
        .map(item => {
          // Type assertion with runtime check
          if (isTextItem(item)) {
            return item.str
          }
          return ''
        })
        .filter(text => text.length > 0)
        .join(' ')
      
      const cleanedText = fullText.trim()
      
      if (!cleanedText || cleanedText.length < 10) {
        throw new Error('No readable text found in PDF using PDF.js')
      }
      
      return cleanedText
    } catch (error) {
      throw new Error(`PDF.js extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private static async extractPDFTextBasic(file: File): Promise<string> {
    // For client-side PDF text extraction, we'll use a more robust approach
    // that handles text properly without relying on raw PDF parsing
    const arrayBuffer = await file.arrayBuffer()
    const uint8Array = new Uint8Array(arrayBuffer)
    
    // Convert to text and look for readable content
    const pdfText = new TextDecoder('utf-8', { fatal: false }).decode(uint8Array)
    
    // Extract text between common PDF text operators
    const textPatterns = [
      /\((.*?)\)\s*Tj/g,  // Text show operator
      /\[(.*?)\]\s*TJ/g,  // Text show with individual glyph positioning
      /BT\s+(.*?)\s+ET/g, // Text object operators
    ]
    
    let extractedText = ''
    
    for (const pattern of textPatterns) {
      const matches = pdfText.match(pattern)
      if (matches) {
        extractedText += matches
          .map(match => match.replace(/[\(\)\[\]]/g, '').replace(/[^\x20-\x7E\s]/g, ' '))
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim()
      }
    }
    
    // If no structured text found, try to extract any readable ASCII text
    if (!extractedText) {
      const asciiText = pdfText.replace(/[^\x20-\x7E\s]/g, ' ').replace(/\s+/g, ' ').trim()
      if (asciiText.length > 50) { // Reasonable threshold for meaningful text
        extractedText = asciiText
      }
    }
    
    if (!extractedText || extractedText.length < 10) {
      throw new Error('No readable text found in PDF - may be image-based')
    }
    
    return extractedText
  }

  private static async processDocx(file: File): Promise<OCRResult> {
    try {
      const arrayBuffer = await file.arrayBuffer()
      const result = await mammoth.extractRawText({ arrayBuffer })
      
      if (!result.value || result.value.trim().length < 10) {
        throw new Error('No readable text found in DOCX file')
      }
      
      // Log any warnings from mammoth
      if (result.messages && result.messages.length > 0) {
        console.log('DOCX extraction warnings:', result.messages)
      }
      
      return {
        text: result.value.trim(),
        confidence: 1.0 // High confidence for native text extraction
      }
    } catch (error) {
      throw new Error(`DOCX processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private static async processDoc(file: File): Promise<OCRResult> {
    // For legacy DOC files, we'll fall back to OCR since reliable text extraction
    // from binary DOC format is complex and requires specialized libraries
    // that may not work well in browser environments
    try {
      console.log('Processing legacy DOC file - falling back to OCR')
      return await this.processImage(file)
    } catch (error) {
      throw new Error(`DOC processing failed: Legacy DOC format requires OCR processing. ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private static async processImage(file: File): Promise<OCRResult> {
    await this.initializeWorker()
    
    if (!this.worker) {
      throw new Error('OCR worker not initialized')
    }

    const { data: { text, confidence } } = await this.worker.recognize(file)
    
    return {
      text: text.trim(),
      confidence: confidence / 100 // Convert to 0-1 scale
    }
  }

  static async cleanup(): Promise<void> {
    if (this.worker) {
      await this.worker.terminate()
      this.worker = null
    }
  }
}

// PDF to Image conversion utility (for image-based PDFs)
export class PDFToImageConverter {
  static async convertFirstPage(file: File): Promise<File> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      
      if (!ctx) {
        reject(new Error('Canvas context not available'))
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          canvas.width = img.width
          canvas.height = img.height
          ctx.drawImage(img, 0, 0)
          
          canvas.toBlob((blob) => {
            if (blob) {
              const imageFile = new File([blob], 'resume-page.png', { type: 'image/png' })
              resolve(imageFile)
            } else {
              reject(new Error('Failed to convert PDF to image'))
            }
          }, 'image/png')
        }
        img.onerror = () => reject(new Error('Failed to load PDF as image'))
        img.src = e.target?.result as string
      }
      reader.onerror = () => reject(new Error('Failed to read PDF file'))
      reader.readAsDataURL(file)
    })
  }
}