import Tesseract from 'tesseract.js'

export interface OCRResult {
  text: string
  confidence: number
}

export class OCRProcessor {
  private static worker: Tesseract.Worker | null = null

  static async initializeWorker(): Promise<void> {
    if (this.worker) return

    this.worker = await Tesseract.createWorker('eng')
  }

  static async processFile(file: File): Promise<OCRResult> {
    try {
      if (file.type === 'application/pdf') {
        return await this.processPDF(file)
      } else if (file.type.startsWith('image/')) {
        return await this.processImage(file)
      } else {
        throw new Error('Unsupported file type for OCR')
      }
    } catch (error) {
      throw new Error(`OCR processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private static async processPDF(file: File): Promise<OCRResult> {
    // For PDF files, we'll first try to extract text directly
    // If that fails, we'll convert to image and use OCR
    try {
      const text = await this.extractPDFText(file)
      if (text.trim().length > 0) {
        return { text, confidence: 1.0 }
      }
    } catch {
      console.log('PDF text extraction failed, falling back to OCR')
    }

    // Fallback to OCR for image-based PDFs
    return await this.processImage(file)
  }

  private static async extractPDFText(file: File): Promise<string> {
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