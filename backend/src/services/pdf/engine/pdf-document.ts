import PDFDocument from 'pdfkit';
import type { Response } from 'express';

export class PdfDocument {
  private doc: PDFKit.PDFDocument;
  public y: number;
  readonly marginLeft = 40;
  readonly marginRight = 40;
  readonly marginTop = 40;
  readonly marginBottom = 60;
  readonly pageWidth = 595.28; // A4 width in pt
  readonly pageHeight = 841.89; // A4 height in pt
  readonly usableWidth: number;

  constructor(res: Response) {
    this.doc = new PDFDocument({ margin: 20, size: 'A4' });
    this.doc.pipe(res);
    this.y = this.marginTop;
    this.usableWidth = this.pageWidth - this.marginLeft - this.marginRight;
  }

  /**
   * Advance current Y position.
   * Automatically adds a new page if the bottom margin is reached.
   * @param height Height to advance
   * @param onNewPage Optional callback called when a new page is added (useful for re-rendering headers)
   */
  advance(height: number, onNewPage?: () => void): void {
    if (this.y + height > this.pageHeight - this.marginBottom) {
      this.doc.addPage();
      this.y = this.marginTop;
      onNewPage?.();
    }
    this.y += height;
  }

  syncY(): void {
    this.y = this.doc.y;
  }

  end(): void {
    this.doc.end();
  }

  /**
   * Access the underlying PDFKit instance for direct drawing
   */
  get raw(): PDFKit.PDFDocument {
    return this.doc;
  }
}
