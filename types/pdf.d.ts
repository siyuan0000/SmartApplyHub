/**
 * Type definitions for PDF generation functionality
 */

declare module 'html2canvas' {
  interface Html2CanvasOptions {
    allowTaint?: boolean
    backgroundColor?: string | null
    canvas?: HTMLCanvasElement
    foreignObjectRendering?: boolean
    ignoreElements?: (element: Element) => boolean
    height?: number
    logging?: boolean
    onclone?: (clonedDoc: Document, element: HTMLElement) => void
    proxy?: string
    removeContainer?: boolean
    scale?: number
    scrollX?: number
    scrollY?: number
    useCORS?: boolean
    width?: number
    x?: number
    y?: number
  }

  function html2canvas(element: HTMLElement, options?: Html2CanvasOptions): Promise<HTMLCanvasElement>
  export = html2canvas
}

declare module 'jspdf' {
  interface jsPDFOptions {
    orientation?: 'portrait' | 'landscape' | 'p' | 'l'
    unit?: 'pt' | 'mm' | 'cm' | 'in'
    format?: string | number[]
    compress?: boolean
    precision?: number
    filters?: string[]
    userUnit?: number
    encryption?: {
      userPassword?: string
      ownerPassword?: string
      userPermissions?: string[]
    }
    putOnlyUsedFonts?: boolean
    hotfixes?: string[]
  }

  class jsPDF {
    constructor(options?: jsPDFOptions)
    
    addImage(
      imageData: string | HTMLImageElement | HTMLCanvasElement,
      format: string,
      x: number,
      y: number,
      width?: number,
      height?: number,
      alias?: string,
      compression?: string,
      rotation?: number
    ): jsPDF

    output(type: 'blob'): Blob
    output(type: 'datauristring' | 'datauri'): string
    output(type: 'string'): string
    output(type?: string): any

    save(filename?: string): jsPDF
    
    text(text: string | string[], x: number, y: number, options?: any): jsPDF
    
    setFontSize(size: number): jsPDF
    setFont(fontName: string, fontStyle?: string): jsPDF
    
    internal: {
      pageSize: {
        width: number
        height: number
      }
    }
  }

  export = jsPDF
}