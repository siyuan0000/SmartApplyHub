import Tesseract from "tesseract.js";
import * as mammoth from "mammoth";

export interface OCRResult {
  text: string;
  confidence: number;
}

// Type guard to check if an item has a str property
function isTextItem(item: unknown): item is { str: string } {
  return (
    typeof item === "object" &&
    item !== null &&
    "str" in item &&
    typeof (item as { str: unknown }).str === "string"
  );
}

export class OCRProcessor {
  private static worker: Tesseract.Worker | null = null;

  static async initializeWorker(): Promise<void> {
    if (this.worker) return;

    this.worker = await Tesseract.createWorker("eng+chi_sim");
  }

  static async validatePageCount(file: File): Promise<void> {
    if (file.type === "application/pdf") {
      const pageCount = await this.getPDFPageCount(file);
      if (pageCount > 1) {
        throw new Error(
          `Your resume has ${pageCount} pages. Please upload a 1-page resume only. Multi-page resumes should be condensed to a single page for optimal ATS compatibility.`
        );
      }
    }
    // For DOCX/DOC files, we'll rely on size limits as proxy for page count
    // since determining exact page count requires complex layout calculations
    if (
      file.type ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      file.type === "application/msword"
    ) {
      // Typical 1-page resume with normal formatting is under 500KB
      // This is a reasonable heuristic for page count validation
      if (file.size > 750 * 1024) {
        // 750KB limit for Word docs
        throw new Error(
          "Your document appears to be quite large. Please ensure it's a 1-page resume only. Multi-page resumes should be condensed to a single page for optimal ATS compatibility."
        );
      }
    }
  }

  private static async getPDFPageCount(file: File): Promise<number> {
    try {
      if (typeof window === "undefined") {
        throw new Error(
          "PDF page count detection only available in browser environment"
        );
      }

      const pdfjsLib = await import("pdfjs-dist");
      pdfjsLib.GlobalWorkerOptions.workerSrc = `data:application/javascript;base64,${btoa(
        "self.onmessage=function(){}"
      )}`; // Inline worker

      const arrayBuffer = await file.arrayBuffer();
      const typedArray = new Uint8Array(arrayBuffer);

      const loadingTask = pdfjsLib.getDocument({ data: typedArray });
      const pdf = await loadingTask.promise;

      return pdf.numPages;
    } catch (error) {
      console.warn("Failed to get PDF page count:", error);
      // If we can't determine page count, allow processing but log warning
      return 1;
    }
  }

  static async processFile(file: File): Promise<OCRResult> {
    // OCR_DEBUG: File processing start
    console.log(
      "[OCR] Processing file:",
      file.name,
      file.type,
      `${(file.size / 1024).toFixed(2)}KB`
    );

    // Validate file before processing
    if (!file || file.size === 0) {
      throw new Error("Invalid file: File is empty or corrupted");
    }

    if (file.size > 10 * 1024 * 1024) {
      throw new Error("File too large: Maximum file size is 10MB");
    }

    // Validate page count for 1-page requirement
    await this.validatePageCount(file);

    try {
      if (file.type === "application/pdf") {
        // OCR_DEBUG: PDF route
        console.log("[OCR] Route: PDF processing");
        return await this.processPDF(file);
      } else if (
        file.type ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      ) {
        return await this.processDocx(file);
      } else if (file.type === "application/msword") {
        return await this.processDoc(file);
      } else if (file.type.startsWith("image/")) {
        return await this.processImage(file);
      } else {
        throw new Error(
          `Unsupported file type: ${file.type}. Only PDF, DOCX, DOC, and image files are supported.`
        );
      }
    } catch (error) {
      // Preserve the original error message if it's already descriptive
      if (
        error instanceof Error &&
        error.message.includes("processing failed:")
      ) {
        throw error;
      }

      // Add context based on file type
      const fileTypeContext = this.getFileTypeContext(file.type);
      throw new Error(
        `${fileTypeContext} processing failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  private static getFileTypeContext(fileType: string): string {
    if (fileType === "application/pdf") {
      return "PDF";
    } else if (
      fileType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      return "DOCX";
    } else if (fileType === "application/msword") {
      return "DOC";
    } else if (fileType.startsWith("image/")) {
      return "Image OCR";
    }
    return "File";
  }

  private static async processPDF(file: File): Promise<OCRResult> {
    console.log("[OCR] PDF processing: trying text extraction first");

    // Method 1: PDF.js text extraction (for text-based PDFs)
    try {
      const text = await this.extractPDFTextWithLibrary(file);
      if (text.trim().length > 50) {
        console.log("[OCR] PDF.js SUCCESS - Length:", text.length);
        console.log("[OCR] Text preview:", text.substring(0, 100) + "...");
        return { text, confidence: 1.0 };
      }
    } catch (error) {
      console.log(
        "[OCR] PDF.js failed:",
        error instanceof Error ? error.message : "Unknown error"
      );
    }

    // Method 2: Convert PDF to image and run OCR (for image-based/scanned PDFs)
    console.log(
      "[OCR] PDF text extraction failed, converting to image for OCR"
    );
    try {
      const imageFile = await PDFToImageConverter.convertFirstPage(file);
      console.log(
        "[OCR] PDF converted to image:",
        imageFile.type,
        `${(imageFile.size / 1024).toFixed(2)}KB`
      );

      const result = await this.processImage(imageFile);
      console.log("[OCR] OCR complete - Length:", result.text.length);
      return result;
    } catch (error) {
      console.log(
        "[OCR] PDF to image conversion failed:",
        error instanceof Error ? error.message : "Unknown error"
      );
      throw new Error(
        "Cannot extract text from this PDF - it may be corrupted or unsupported"
      );
    }
  }

  private static async extractPDFTextWithLibrary(file: File): Promise<string> {
    console.log("[OCR] Starting PDF.js text extraction");

    // Dynamic import to avoid SSR issues
    if (typeof window === "undefined") {
      throw new Error(
        "PDF.js extraction only available in browser environment"
      );
    }

    try {
      const pdfjsLib = await import("pdfjs-dist");

      // Disable workers by providing inline worker - modern PDF.js requires this
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
      console.log("[OCR] PDF.js configured (inline worker mode)");

      const arrayBuffer = await file.arrayBuffer();
      const typedArray = new Uint8Array(arrayBuffer);

      const loadingTask = pdfjsLib.getDocument({ data: typedArray });
      const pdf = await loadingTask.promise;
      console.log("[OCR] PDF loaded successfully -", pdf.numPages, "pages");

      // Extract text from first page only (1-page resume requirement)
      const page = await pdf.getPage(1);
      const textContent = await page.getTextContent();

      const textItems = textContent.items
        .filter(isTextItem)
        .map((item) => item as { str: string })
        .map((item) => item.str)
        .filter((text) => text.length > 0);

      const fullText = textItems.join(" ").trim();
      console.log("[OCR] Extracted text length:", fullText.length);

      if (!fullText || fullText.length < 50) {
        throw new Error("Insufficient readable text found in PDF");
      }

      return fullText;
    } catch (error) {
      console.log(
        "[OCR] PDF.js extraction failed:",
        error instanceof Error ? error.message : "Unknown error"
      );
      throw error;
    }
  }

  private static async processDocx(file: File): Promise<OCRResult> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });

      if (!result.value || result.value.trim().length < 10) {
        throw new Error("No readable text found in DOCX file");
      }

      // Log any warnings from mammoth
      if (result.messages && result.messages.length > 0) {
        console.log("DOCX extraction warnings:", result.messages);
      }

      return {
        text: result.value.trim(),
        confidence: 1.0, // High confidence for native text extraction
      };
    } catch (error) {
      throw new Error(
        `DOCX processing failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  private static async processDoc(file: File): Promise<OCRResult> {
    // For legacy DOC files, we'll fall back to OCR since reliable text extraction
    // from binary DOC format is complex and requires specialized libraries
    // that may not work well in browser environments
    try {
      console.log("Processing legacy DOC file - falling back to OCR");
      return await this.processImage(file);
    } catch (error) {
      throw new Error(
        `DOC processing failed: Legacy DOC format requires OCR processing. ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  private static async processImage(file: File): Promise<OCRResult> {
    console.log("[OCR] Tesseract image OCR starting");
    console.log("[OCR] File type:", file.type, "Size:", file.size, "bytes");

    await this.initializeWorker();

    if (!this.worker) {
      console.log("[OCR] Worker initialization failed");
      throw new Error("OCR worker not initialized");
    }

    console.log("[OCR] Worker ready - starting recognition");

    const {
      data: { text, confidence },
    } = await this.worker.recognize(file);

    console.log("[OCR] Tesseract completed");
    console.log("[OCR] Text length:", text.length);
    console.log("[OCR] Confidence:", confidence, "%");
    console.log("[OCR] Text preview:", text.substring(0, 100) + "...");

    return {
      text: text.trim(),
      confidence: confidence / 100, // Convert to 0-1 scale
    };
  }

  static async cleanup(): Promise<void> {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
    }
  }
}

// PDF to Image conversion utility using PDF.js rendering
export class PDFToImageConverter {
  static async convertFirstPage(file: File): Promise<File> {
    console.log(
      "[OCR] Starting PDF-to-image conversion using PDF.js rendering"
    );

    if (typeof window === "undefined") {
      throw new Error(
        "PDF-to-image conversion only available in browser environment"
      );
    }

    try {
      const pdfjsLib = await import("pdfjs-dist");

      // Use the same inline worker approach as other PDF.js operations
      pdfjsLib.GlobalWorkerOptions.workerSrc = `data:application/javascript;base64,${btoa(
        "self.onmessage=function(){}"
      )}`;

      const arrayBuffer = await file.arrayBuffer();
      const typedArray = new Uint8Array(arrayBuffer);

      const pdf = await pdfjsLib.getDocument({ data: typedArray }).promise;
      const page = await pdf.getPage(1);
      const viewport = page.getViewport({ scale: 2.0 });

      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");

      if (!context) {
        throw new Error("Canvas context not available");
      }

      canvas.width = viewport.width;
      canvas.height = viewport.height;

      console.log(
        "[OCR] Rendering PDF page to canvas:",
        `${viewport.width}x${viewport.height}`
      );
      await page.render({ canvasContext: context, viewport }).promise;

      return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) {
            const imageFile = new File([blob], "resume-page.png", {
              type: "image/png",
            });
            console.log(
              "[OCR] PDF rendered to image:",
              `${(imageFile.size / 1024).toFixed(2)}KB`
            );
            resolve(imageFile);
          } else {
            reject(new Error("Failed to convert canvas to blob"));
          }
        }, "image/png");
      });
    } catch (error) {
      console.log("[OCR] PDF-to-image conversion failed:", error);
      throw new Error(
        `PDF-to-image conversion failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }
}
