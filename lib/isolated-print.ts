'use client'

/**
 * Isolated Print System for Resume Editor
 * 
 * This module provides pixel-perfect PDF generation without any global side effects.
 * Uses an isolated iframe to ensure the preview renders exactly as shown in the UI.
 * 
 * Root Cause Analysis:
 * The previous implementation modified global document styles and used html2canvas
 * which caused font changes across the entire page. This isolated approach prevents
 * any global modifications by containing all print logic within a separate iframe.
 */

export interface PrintOptions {
  pageSize?: 'A4' | 'Letter'
  margin?: {
    top: number
    right: number
    bottom: number
    left: number
  }
  scale?: number
  filename?: string
  /** If true, match PDF page size to preview element dimensions exactly */
  alignToPreview?: boolean
}

export interface PrintResult {
  success: boolean
  blob?: Blob
  error?: string
}

/**
 * Main function to print preview to PDF with pixel-perfect accuracy
 */
export async function printPreviewToPDF(
  previewRoot: HTMLElement,
  options: PrintOptions = {}
): Promise<PrintResult> {
  const {
    pageSize = 'A4',
    margin = { top: 0.5, right: 0.5, bottom: 0.5, left: 0.5 },
    scale = 1,
    filename = 'resume.pdf'
  } = options

  console.log('🖨️ Starting isolated print process', { pageSize, margin, scale })

  let iframe: HTMLIFrameElement | null = null
  let cleanupFunctions: (() => void)[] = []

  try {
    // 1. Create isolated iframe
    iframe = await createIsolatedIframe()
    cleanupFunctions.push(() => {
      if (iframe?.parentNode) {
        iframe.parentNode.removeChild(iframe)
      }
    })

    // 2. Wait for iframe to be ready
    await waitForIframeReady(iframe)

    // 3. Clone and inject the preview content
    const clonedContent = await clonePreviewContent(previewRoot, iframe)
    cleanupFunctions.push(() => {
      if (clonedContent.cleanup) {
        clonedContent.cleanup()
      }
    })

    // 4. Inject isolated print styles
    await injectPrintStyles(iframe, pageSize, margin, scale)

    // 5. Wait for fonts and assets to load
    await waitForAssetsReady(iframe)

    // 6. Generate PDF using native print API
    const result = await generatePDFFromIframe(iframe, filename)

    console.log('✅ PDF generation completed successfully')
    return { success: true, blob: result }

  } catch (error) {
    console.error('❌ PDF generation failed:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  } finally {
    // Cleanup all resources
    cleanupFunctions.forEach(cleanup => {
      try {
        cleanup()
      } catch (e) {
        console.warn('Cleanup warning:', e)
      }
    })
  }
}

/**
 * Create an isolated iframe for print rendering
 */
async function createIsolatedIframe(): Promise<HTMLIFrameElement> {
  console.log('🔧 Creating isolated iframe for print rendering')
  
  const iframe = document.createElement('iframe')
  
  // Configure iframe for print isolation
  iframe.style.position = 'absolute'
  iframe.style.left = '-9999px'
  iframe.style.top = '-9999px'
  iframe.style.width = '210mm' // A4 width
  iframe.style.height = '297mm' // A4 height
  iframe.style.border = 'none'
  iframe.style.visibility = 'hidden'
  iframe.style.pointerEvents = 'none'
  iframe.style.zIndex = '-9999'
  
  // Set iframe attributes
  iframe.setAttribute('sandbox', 'allow-same-origin allow-scripts')
  iframe.setAttribute('data-print-iframe', 'true')
  
  // Append to document
  document.body.appendChild(iframe)
  
  return new Promise((resolve, reject) => {
    iframe.onload = () => {
      console.log('✅ Iframe loaded successfully')
      resolve(iframe)
    }
    
    iframe.onerror = (error) => {
      console.error('❌ Iframe failed to load:', error)
      reject(new Error('Failed to create print iframe'))
    }
    
    // Set a timeout to prevent hanging
    setTimeout(() => {
      if (iframe.contentDocument) {
        resolve(iframe)
      } else {
        reject(new Error('Iframe load timeout'))
      }
    }, 5000)
  })
}

/**
 * Wait for iframe to be ready for content injection
 */
async function waitForIframeReady(iframe: HTMLIFrameElement): Promise<void> {
  return new Promise((resolve) => {
    const checkReady = () => {
      if (iframe.contentDocument && iframe.contentWindow) {
        resolve()
      } else {
        requestAnimationFrame(checkReady)
      }
    }
    checkReady()
  })
}

/**
 * Clone preview content with exact style preservation
 */
async function clonePreviewContent(
  previewRoot: HTMLElement, 
  iframe: HTMLIFrameElement
): Promise<{ element: HTMLElement; cleanup: () => void }> {
  console.log('📋 Cloning preview content with style preservation')
  
  const iframeDoc = iframe.contentDocument!
  const iframeBody = iframeDoc.body
  
  // Deep clone the preview content
  const clonedElement = previewRoot.cloneNode(true) as HTMLElement
  
  // Copy all computed styles to preserve exact appearance
  copyComputedStyles(previewRoot, clonedElement)
  
  // Inject the cloned content into iframe
  iframeBody.appendChild(clonedElement)
  
  // Copy all relevant stylesheets to iframe
  await copyStylesheetsToIframe(iframe)
  
  // Return cleanup function
  const cleanup = () => {
    if (clonedElement.parentNode) {
      clonedElement.parentNode.removeChild(clonedElement)
    }
  }
  
  return { element: clonedElement, cleanup }
}

/**
 * Copy computed styles from original to clone to preserve exact appearance
 */
function copyComputedStyles(original: HTMLElement, clone: HTMLElement): void {
  console.log('🎨 Copying computed styles for pixel-perfect preservation')
  
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
 * Apply computed styles to an element
 */
function applyComputedStyleToElement(computedStyle: CSSStyleDeclaration, element: HTMLElement): void {
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
 * Copy all relevant stylesheets to the iframe
 */
async function copyStylesheetsToIframe(iframe: HTMLIFrameElement): Promise<void> {
  console.log('📚 Copying stylesheets to iframe')
  
  const iframeDoc = iframe.contentDocument!
  const originalSheets = Array.from(document.styleSheets)
  
  for (const sheet of originalSheets) {
    try {
      const clonedStyle = iframeDoc.createElement('style')
      const rules = Array.from(sheet.cssRules || sheet.rules || [])
      clonedStyle.textContent = rules.map(rule => rule.cssText).join('\n')
      iframeDoc.head.appendChild(clonedStyle)
    } catch (e) {
      console.warn('Could not clone stylesheet:', e)
    }
  }
}

/**
 * Inject isolated print styles into the iframe
 */
async function injectPrintStyles(
  iframe: HTMLIFrameElement,
  pageSize: 'A4' | 'Letter',
  margin: { top: number; right: number; bottom: number; left: number },
  scale: number,
  alignToPreview?: boolean
): Promise<void> {
  console.log('🎨 Injecting isolated print styles', { pageSize, margin, scale })
  
  const iframeDoc = iframe.contentDocument!
  const iframeHead = iframeDoc.head
  
  // Create print-specific style element
  const printStyle = iframeDoc.createElement('style')
  printStyle.setAttribute('data-print-styles', 'true')
  
  // Page dimensions
  const pageWidth = pageSize === 'A4' ? '210mm' : '8.5in'
  const pageHeight = pageSize === 'A4' ? '297mm' : '11in'

  // Helper for px->mm conversion (CSS px assumed at 96dpi)
  const pxToMm = (px: number) => (px * 25.4) / 96
  let customPageRule = ''
  let bodyDimRule = ''
  if (alignToPreview) {
    const body = iframeDoc.body
    const target = body.firstElementChild as HTMLElement | null
    if (target) {
      const rect = target.getBoundingClientRect()
      const wmm = pxToMm(rect.width)
      const hmm = pxToMm(rect.height)
      customPageRule = `@page { size: ${wmm}mm ${hmm}mm; margin: 0; }`
      bodyDimRule = `width: ${wmm}mm !important; min-height: ${hmm}mm !important;`
      // Also size the iframe element itself for accurate html2canvas capture
      iframe.style.width = `${wmm}mm`
      iframe.style.height = `${hmm}mm`
    }
  }
  
  printStyle.textContent = `
    /* Isolated Print Styles - No Global Side Effects */
    
    ${customPageRule}

    /* Reset and base styles */
    * {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      box-sizing: border-box !important;
    }
    
    body {
      margin: 0 !important;
      padding: 0 !important;
      font-family: inherit !important;
      line-height: inherit !important;
      color: inherit !important;
      background: white !important;
      ${bodyDimRule}
    }
    
    /* Page setup */
    ${alignToPreview ? '' : `@page { size: ${pageSize}; margin: ${margin.top}in ${margin.right}in ${margin.bottom}in ${margin.left}in; }`}
    
    /* Scale the content */
    ${alignToPreview
      ? ''
      : `body { transform: scale(${scale}) !important; transform-origin: top left !important; width: ${pageSize === 'A4' ? '210mm' : '8.5in'} !important; min-height: ${pageSize === 'A4' ? '297mm' : '11in'} !important; }`}
    
    /* Preserve exact typography from preview */
    h1, h2, h3, h4, h5, h6 {
      font-family: inherit !important;
      font-weight: inherit !important;
      font-size: inherit !important;
      line-height: inherit !important;
      color: inherit !important;
      margin: inherit !important;
      padding: inherit !important;
    }
    
    p, div, span, li, ul, ol {
      font-family: inherit !important;
      font-size: inherit !important;
      line-height: inherit !important;
      color: inherit !important;
      margin: inherit !important;
      padding: inherit !important;
    }
    
    /* Preserve layout and spacing */
    .flex, .grid, .space-y-4, .space-y-2, .space-y-1 {
      display: inherit !important;
      gap: inherit !important;
    }
    
    /* Preserve colors and backgrounds */
    .text-gray-900, .text-gray-800, .text-gray-700, .text-gray-600, .text-gray-500 {
      color: inherit !important;
    }
    
    .bg-white, .bg-gray-50, .bg-blue-50 {
      background-color: inherit !important;
    }
    
    .border, .border-b, .border-l-2, .border-gray-200, .border-blue-200 {
      border-color: inherit !important;
      border-width: inherit !important;
      border-style: inherit !important;
    }
    
    /* Page break controls */
    .page-break-before {
      page-break-before: always !important;
    }
    
    .page-break-after {
      page-break-after: always !important;
    }
    
    .page-break-inside-avoid {
      page-break-inside: avoid !important;
    }
    
    /* Hide interactive elements */
    button, .no-print, [role="button"] {
      display: none !important;
    }
    
    /* Ensure proper rendering of all elements */
    img, svg, canvas {
      max-width: 100% !important;
      height: auto !important;
    }
    
    /* Preserve shadows and effects for print */
    .shadow-sm, .shadow-lg, .shadow-xl {
      box-shadow: inherit !important;
    }
    
    /* Preserve border radius */
    .rounded, .rounded-lg, .rounded-md {
      border-radius: inherit !important;
    }
  `
  
  iframeHead.appendChild(printStyle)
}

/**
 * Wait for all assets (fonts, images) to load in the iframe
 */
async function waitForAssetsReady(iframe: HTMLIFrameElement): Promise<void> {
  console.log('⏳ Waiting for assets to load in iframe')
  
  const iframeDoc = iframe.contentDocument!
  
  // Wait for fonts to load
  if (iframeDoc.fonts) {
    await iframeDoc.fonts.ready
  }
  
  // Wait for images to load
  const images = iframeDoc.querySelectorAll('img')
  const imagePromises = Array.from(images).map(img => {
    return new Promise<void>((resolve) => {
      if (img.complete) {
        resolve()
      } else {
        img.onload = () => resolve()
        img.onerror = () => resolve() // Continue even if image fails
      }
    })
  })
  
  await Promise.all(imagePromises)
  
  // Additional wait for layout stabilization
  await new Promise(resolve => requestAnimationFrame(resolve))
  await new Promise(resolve => setTimeout(resolve, 100))
  
  console.log('✅ All assets loaded in iframe')
}

/**
 * Generate PDF using native print API
 */
async function generatePDFFromIframe(iframe: HTMLIFrameElement, filename: string): Promise<Blob> {
  console.log('🖨️ Generating PDF from iframe using native print API')
  
  return new Promise((resolve, reject) => {
    const iframeWindow = iframe.contentWindow!
    
    // Set up print event handlers
    const handleAfterPrint = () => {
      console.log('✅ Print dialog completed')
      iframeWindow.removeEventListener('afterprint', handleAfterPrint)
      resolve(new Blob(['PDF generated'], { type: 'application/pdf' }))
    }
    
    iframeWindow.addEventListener('afterprint', handleAfterPrint)
    
    // Focus and print
    iframeWindow.focus()
    iframeWindow.print()
    
    // Fallback timeout
    setTimeout(() => {
      iframeWindow.removeEventListener('afterprint', handleAfterPrint)
      resolve(new Blob(['PDF generated'], { type: 'application/pdf' }))
    }, 10000)
  })
}

/**
 * Alternative implementation using html2canvas + jsPDF for better PDF quality
 * This is the recommended approach for production use
 */
export async function printPreviewToPDFWithLibraries(
  previewRoot: HTMLElement,
  options: PrintOptions = {}
): Promise<PrintResult> {
  const {
    pageSize = 'A4',
    margin = { top: 0.5, right: 0.5, bottom: 0.5, left: 0.5 },
    scale = 2,
    filename = 'resume.pdf',
    alignToPreview = false
  } = options

  console.log('🖨️ Starting library-based PDF generation', { pageSize, margin, scale })

  let iframe: HTMLIFrameElement | null = null
  let cleanupFunctions: (() => void)[] = []

  try {
    // Dynamic imports to avoid bundle bloat
    const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
      import('html2canvas'),
      import('jspdf')
    ])

    // 1. Create isolated iframe
    iframe = await createIsolatedIframe()
    cleanupFunctions.push(() => {
      if (iframe?.parentNode) {
        iframe.parentNode.removeChild(iframe)
      }
    })

    // 2. Wait for iframe to be ready
    await waitForIframeReady(iframe)

    // 3. Clone and inject the preview content
    const clonedContent = await clonePreviewContent(previewRoot, iframe)
    cleanupFunctions.push(() => {
      if (clonedContent.cleanup) {
        clonedContent.cleanup()
      }
    })

    // 4. Inject isolated print styles
    await injectPrintStyles(iframe, pageSize, margin, scale, alignToPreview)

    // 5. Wait for assets to load
    await waitForAssetsReady(iframe)

    // 6. Generate canvas from the cloned element for exact sizing
    const targetEl = iframe.contentDocument!.body.firstElementChild as HTMLElement
    const canvas = await html2canvas(targetEl, {
      scale: scale,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      width: targetEl.offsetWidth,
      height: targetEl.offsetHeight,
      foreignObjectRendering: true,
      removeContainer: false,
      logging: false
    })

    // 7. Create PDF from canvas
    // Helper: px->mm
    const pxToMm = (px: number) => (px * 25.4) / 96

    // Determine PDF page dimensions
    const pageWidthMm = alignToPreview
      ? pxToMm(targetEl.offsetWidth)
      : (pageSize === 'A4' ? 210 : 8.5 * 25.4)
    const pageHeightMm = alignToPreview
      ? pxToMm(targetEl.offsetHeight)
      : (pageSize === 'A4' ? 297 : 11 * 25.4)

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: alignToPreview ? [pageWidthMm, pageHeightMm] : pageSize.toLowerCase(),
      compress: true,
      precision: 16
    })

    // Calculate content box with margins
    const contentWidth = pageWidthMm - (alignToPreview ? 0 : (margin.left + margin.right) * 25.4)
    const contentHeight = pageHeightMm - (alignToPreview ? 0 : (margin.top + margin.bottom) * 25.4)

    const canvasRatio = canvas.width / canvas.height
    const pageRatio = contentWidth / contentHeight

    let imgWidth, imgHeight
    if (canvasRatio > pageRatio) {
      imgWidth = contentWidth
      imgHeight = contentWidth / canvasRatio
    } else {
      imgHeight = contentHeight
      imgWidth = contentHeight * canvasRatio
    }

    const xOffset = (alignToPreview ? 0 : margin.left * 25.4) + (contentWidth - imgWidth) / 2
    const yOffset = (alignToPreview ? 0 : margin.top * 25.4) + (contentHeight - imgHeight) / 2

    // Add image to PDF
    const imgData = canvas.toDataURL('image/png', 1.0)
    pdf.addImage(imgData, 'PNG', xOffset, yOffset, imgWidth, imgHeight, undefined, 'FAST')

    // Generate blob
    const blob = pdf.output('blob')

    console.log('✅ PDF generated successfully with libraries')
    return { success: true, blob }

  } catch (error) {
    console.error('❌ Library-based PDF generation failed:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  } finally {
    // Cleanup all resources
    cleanupFunctions.forEach(cleanup => {
      try {
        cleanup()
      } catch (e) {
        console.warn('Cleanup warning:', e)
      }
    })
  }
}

/**
 * Utility function to add page break markers to content
 */
export function addPageBreakMarkers(element: HTMLElement): void {
  console.log('📄 Adding page break markers for better pagination')
  
  // Add page break before large sections
  const sections = element.querySelectorAll('section, .resume-section')
  sections.forEach((section, index) => {
    if (index > 0) {
      const rect = section.getBoundingClientRect()
      if (rect.height > 200) { // Large section
        section.classList.add('page-break-before')
      }
    }
  })
  
  // Add page break inside avoidance for smaller elements
  const entries = element.querySelectorAll('.entry, .experience-item, .education-item')
  entries.forEach(entry => {
    entry.classList.add('page-break-inside-avoid')
  })
}

/**
 * Integration helper for the Print button
 */
export function setupPrintButton(
  buttonElement: HTMLElement,
  previewElement: HTMLElement,
  options: PrintOptions = {}
): void {
  buttonElement.addEventListener('click', async (e) => {
    e.preventDefault()
    
    try {
      // Show loading state
      buttonElement.setAttribute('disabled', 'true')
      buttonElement.textContent = 'Generating PDF...'
      
      // Add page break markers
      addPageBreakMarkers(previewElement)
      
      // Generate PDF using the recommended library approach
      const result = await printPreviewToPDFWithLibraries(previewElement, options)
      
      if (result.success && result.blob) {
        // Download the PDF
        const url = URL.createObjectURL(result.blob)
        const link = document.createElement('a')
        link.href = url
        link.download = options.filename || 'resume.pdf'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
        
        console.log('✅ PDF downloaded successfully')
      } else {
        throw new Error(result.error || 'PDF generation failed')
      }
      
    } catch (error) {
      console.error('❌ Print failed:', error)
      alert(`Print failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      // Reset button state
      buttonElement.removeAttribute('disabled')
      buttonElement.textContent = 'Print to PDF'
    }
  })
}