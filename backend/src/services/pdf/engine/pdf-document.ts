const PdfPrinter = require('pdfmake/js/printer').default;
import type { TDocumentDefinitions } from 'pdfmake/interfaces';
import type { Response } from 'express';

// Fonts definition for PdfPrinter - using standard PDF fonts
const fonts = {
  Helvetica: {
    normal: 'Helvetica',
    bold: 'Helvetica-Bold',
    italics: 'Helvetica-Oblique',
    bolditalics: 'Helvetica-BoldOblique'
  }
};

export class PdfDocument {
  private res: Response;
  public docDefinition: TDocumentDefinitions;

  readonly marginLeft = 40;
  readonly marginRight = 30;
  readonly marginTop = 30;
  readonly marginBottom = 100;
  readonly pageWidth = 595.28; // A4 width in pt
  readonly pageHeight = 841.89; // A4 height in pt
  readonly usableWidth = 595.28 - 40 - 30;

  constructor(res: Response) {
    this.res = res;
    this.docDefinition = {
      content: [],
      pageSize: 'A4',
      pageMargins: [this.marginLeft, this.marginTop, this.marginRight, this.marginBottom],
      defaultStyle: {
        font: 'Helvetica',
        fontSize: 9,
        color: '#000000',
      },
    };
  }

  /**
   * Add a pdfmake element to the document content.
   */
  addContent(element: any): void {
    if (Array.isArray(this.docDefinition.content)) {
      this.docDefinition.content.push(element);
    }
  }

  /**
   * Set headers, footers, etc.
   */
  setHeader(header: any): void {
    this.docDefinition.header = header;
  }

  setFooter(footer: any): void {
    this.docDefinition.footer = footer;
  }

  /**
   * Generate the PDF and pipe it to the response.
   */
  async end(): Promise<void> {
    const URLResolver = require('pdfmake/js/URLResolver').default;
    const virtualfs = require('pdfmake/js/virtual-fs').default;
    const printer = new PdfPrinter(fonts, virtualfs, new URLResolver(virtualfs));

    const pdfDoc = await printer.createPdfKitDocument(this.docDefinition);
    pdfDoc.pipe(this.res);
    pdfDoc.end();
  }
}
