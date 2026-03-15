import type { PdfDocument } from './pdf-document';
import type { CompanyInfo, ReportMeta, Address, TableColumn } from './pdf-types';
import bwipjs from 'bwip-js';

// --- Section 1: Company Header ---
export function renderCompanyHeader(pdf: PdfDocument, company: CompanyInfo): void {
  const doc = pdf.raw;
  doc.fontSize(18).font('Helvetica-Bold').text(company.name.toUpperCase(), pdf.marginLeft, pdf.y, { align: 'center', width: pdf.usableWidth });
  pdf.y += 22;

  const addrLines = [
    company.addressLine1,
    [company.city, company.state, company.postalCode].filter(Boolean).join(' '),
  ].filter(Boolean);

  doc.fontSize(9).font('Helvetica').text(addrLines.join(', '), pdf.marginLeft, pdf.y, { align: 'center', width: pdf.usableWidth });
  pdf.y += 12;

  const contactLines = [
    company.gstin ? `GSTIN: ${company.gstin}` : null,
    company.phone ? `Phone: ${company.phone}` : null,
  ].filter(Boolean);

  doc.text(contactLines.join('  |  '), pdf.marginLeft, pdf.y, { align: 'center', width: pdf.usableWidth });
  pdf.y += 15;

  doc.moveTo(pdf.marginLeft, pdf.y).lineTo(pdf.pageWidth - pdf.marginRight, pdf.y).stroke('#CCCCCC');
  pdf.y += 15;
}

// --- Section 2: Report Meta ---
export function renderReportMeta(pdf: PdfDocument, meta: ReportMeta): void {
  const doc = pdf.raw;
  doc.fontSize(14).font('Helvetica-Bold').text(meta.title, pdf.marginLeft, pdf.y);

  const metaX = pdf.pageWidth - pdf.marginRight - 150;
  doc.fontSize(9).font('Helvetica-Bold').text('Number:', metaX, pdf.y);
  doc.font('Helvetica').text(meta.number, metaX + 50, pdf.y);
  pdf.y += 12;

  doc.font('Helvetica-Bold').text('Date:', metaX, pdf.y);
  doc.font('Helvetica').text(meta.date, metaX + 50, pdf.y);
  pdf.y += 12;

  if (meta.extraMeta) {
    for (const extra of meta.extraMeta) {
      doc.font('Helvetica-Bold').text(`${extra.label}:`, metaX, pdf.y);
      doc.font('Helvetica').text(extra.value, metaX + 50, pdf.y);
      pdf.y += 12;
    }
  }
  pdf.y += 5;
}

// --- Section 3: E-Invoice Block ---
export async function renderEInvoiceBlock(
  pdf: PdfDocument,
  irn?: string | null,
  ackNo?: string | null,
  ackDate?: string | null,
  signedQrCode?: string | null,
): Promise<void> {
  if (!irn) return;
  const doc = pdf.raw;

  doc.fontSize(8).font('Helvetica-Bold').text('IRN:', pdf.marginLeft, pdf.y);
  doc.font('Helvetica').text(irn, pdf.marginLeft + 30, pdf.y, { width: 300 });
  const irnHeight = doc.heightOfString(irn, { width: 300 });

  if (signedQrCode) {
    try {
      const qrPng = await bwipjs.toBuffer({
        bcid: 'qrcode',
        text: signedQrCode,
        scale: 2,
        height: 65,
        width: 65,
      });
      doc.image(qrPng, pdf.pageWidth - pdf.marginRight - 65, pdf.y - 10, { width: 65 });
    } catch (e) {
      console.error('QR rendering failed', e);
    }
  }

  pdf.y += irnHeight + 5;
  doc.font('Helvetica-Bold').text('Ack No:', pdf.marginLeft, pdf.y);
  doc.font('Helvetica').text(ackNo || '', pdf.marginLeft + 40, pdf.y);
  doc.font('Helvetica-Bold').text('Ack Date:', pdf.marginLeft + 150, pdf.y);
  doc.font('Helvetica').text(ackDate || '', pdf.marginLeft + 200, pdf.y);
  pdf.y += 15;
}

// --- Section 4: Address Block ---
export function renderAddressBlock(
  pdf: PdfDocument,
  left: Address,
  right?: Address,
  leftLabel = 'BILL TO',
  rightLabel = 'SHIP TO',
): void {
  const doc = pdf.raw;
  const addrY = pdf.y;
  const colWidth = 250;

  const formatAddr = (addr: Address) => {
    const lines = [
      addr.name,
      addr.gstin ? `GSTIN: ${addr.gstin}` : null,
      addr.line1,
      [addr.city, addr.state, addr.postalCode].filter(Boolean).join(' '),
      addr.phone ? `Phone: ${addr.phone}` : null,
    ].filter(Boolean);
    return lines.join('\n');
  };

  doc.fontSize(9).font('Helvetica-Bold').text(leftLabel, pdf.marginLeft, addrY);
  doc.font('Helvetica').text(formatAddr(left), pdf.marginLeft, addrY + 12, { width: colWidth });

  if (right) {
    doc.font('Helvetica-Bold').text(rightLabel, pdf.pageWidth - pdf.marginRight - colWidth, addrY);
    doc.font('Helvetica').text(formatAddr(right), pdf.pageWidth - pdf.marginRight - colWidth, addrY + 12, { width: colWidth });
  }

  pdf.y = Math.max(doc.y, pdf.y) + 15;
}

const CHAR_WIDTH = 6.5; 
const H_PADDING = 14; 
const ROW_HEIGHT = 20;
const EDGE_PADDING = 8;

function drawCell(
  pdf: PdfDocument,
  col: TableColumn,
  value: string,
  x: number,
  y: number,
  rowHeight: number,
  font = 'Helvetica',
  fontSize = 9
): void {
  const pl = col.paddingLeft ?? 0;
  const pr = col.paddingRight ?? 0;
  const textX = x + pl;
  const textWidth = (col.width ?? 0) - pl - pr;

  pdf.raw
    .fontSize(fontSize)
    .font(font)
    .text(value, textX, y + (rowHeight - fontSize) / 2, {
      width: textWidth,
      align: col.align ?? 'left',
      lineBreak: false,
      ellipsis: true,
    });
}

function measureColumns(
  columns: TableColumn[],
  rows: Record<string, any>[],
  usableWidth: number,
): TableColumn[] {
  const natural = columns.map((col) => {
    const headerLen = col.header.length;
    const maxRowLen = rows.reduce((max, row) => {
      const value = col.key === 'index' ? (rows.indexOf(row) + 1).toString() : row[col.key];
      const valStr = col.format ? col.format(value) : (value?.toString() ?? '');
      return Math.max(max, valStr.length);
    }, 0);
    const raw = Math.ceil(Math.max(headerLen, maxRowLen) * CHAR_WIDTH) + H_PADDING;
    const max = col.maxWidth ?? 240;
    return Math.min(max, raw);
  });

  const total = natural.reduce((a, b) => a + b, 0);
  const scale = total > usableWidth ? usableWidth / total : 1;

  const scaled = columns.map((col, i) => {
    const s = Math.floor(natural[i] * scale);
    const min = col.minWidth ?? 28;
    return Math.max(min, s);
  });

  let currentTotal = scaled.reduce((a, b) => a + b, 0);
  let diff = usableWidth - currentTotal;
  if (diff > 0) {
    const flexIdx = columns.findIndex(c => !c.maxWidth);
    if (flexIdx !== -1) scaled[flexIdx] += diff;
    else scaled[scaled.length - 1] += diff;
  }

  return columns.map((col, i) => {
    const isFirst = i === 0;
    const isLast = i === columns.length - 1;

    const extraLeft = isFirst && col.align !== 'left' ? EDGE_PADDING : 0;
    const extraRight = isLast && col.align !== 'right' ? EDGE_PADDING : 0;

    return {
      ...col,
      width: scaled[i],
      paddingLeft: (H_PADDING / 2) + extraLeft,
      paddingRight: (H_PADDING / 2) + extraRight,
    };
  });
}

// --- Section 5: Generic Items Table ---
export function renderItemsTable(
  pdf: PdfDocument,
  columns: TableColumn[],
  rows: any[],
  onNewPage: () => void,
): void {
  const doc = pdf.raw;
  const sized = measureColumns(columns, rows, pdf.usableWidth);

  const drawHeader = (y: number) => {
    doc.rect(pdf.marginLeft, y, pdf.usableWidth, 20).fill('#CCCCCC');
    doc.fillColor('#000000');
    let currentX = pdf.marginLeft;
    for (const col of sized) {
      drawCell(pdf, col, col.header, currentX, y, 20, 'Helvetica-Bold');
      currentX += col.width!;
    }
    return y + 25;
  };

  pdf.y = drawHeader(pdf.y);

  rows.forEach((row, index) => {
    if (pdf.y + ROW_HEIGHT > pdf.pageHeight - pdf.marginBottom) {
      pdf.raw.addPage();
      pdf.y = pdf.marginTop;
      onNewPage();
      pdf.y = drawHeader(pdf.y);
    }

    if (index % 2 === 1) {
      doc.rect(pdf.marginLeft, pdf.y - 2, pdf.usableWidth, ROW_HEIGHT).fill('#F7F7F7');
    }

    doc.fillColor('#000000');
    let currentX = pdf.marginLeft;
    for (const col of sized) {
      const value = col.key === 'index' ? (index + 1).toString() : row[col.key];
      const displayValue = col.format ? col.format(value) : (value?.toString() ?? '');
      drawCell(pdf, col, displayValue, currentX, pdf.y, ROW_HEIGHT);
      currentX += col.width!;
    }
    pdf.y += ROW_HEIGHT;
  });
  pdf.y += 10;
}

// --- Section 6: Totals Block ---
export function renderTotals(
  pdf: PdfDocument,
  totals: {
    subtotal: number;
    discountAmount: number;
    taxAmount: number;
    taxPct: number;
    roundOff: number;
    netAmount: number;
  },
  company: CompanyInfo,
): void {
  const doc = pdf.raw;
  const RIGHT_LABEL_X = 340;
  const RIGHT_VALUE_X = pdf.marginLeft + pdf.usableWidth;
  const LINE_H = 15;

  // Check if totals + footer fit on current page; if not, start new page
  const estimatedHeight = 120; // approx height of totals + footer block
  if (pdf.y + estimatedHeight > pdf.pageHeight - pdf.marginBottom) {
    doc.addPage();
    pdf.y = pdf.marginTop;
  }

  pdf.y += 8; // gap after table

  const fmt = (v: number) => v.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // Helper row drawer
  const drawRow = (label: string, value: string, bold = false) => {
    const size = bold ? 10 : 9;
    const font = bold ? 'Helvetica-Bold' : 'Helvetica';
    doc.fontSize(size).font(font).fillColor('#000000');
    doc.text(label, RIGHT_LABEL_X, pdf.y, { width: 120, align: 'right' });
    doc.text(value, RIGHT_VALUE_X - 80, pdf.y, { width: 80, align: 'right' });
    pdf.y += LINE_H;
  };

  drawRow('Subtotal:', fmt(totals.subtotal));

  if (totals.discountAmount > 0) {
    drawRow('Discount:', `- ${fmt(totals.discountAmount)}`);
  }

  const taxableAmount = totals.subtotal - totals.discountAmount;
  drawRow('Taxable Amount:', fmt(taxableAmount));

  // CGST / SGST split
  const isIgst = company.igstSharingRate === 100;
  if (isIgst) {
    drawRow(`IGST (${totals.taxPct}%):`, fmt(totals.taxAmount));
  } else {
    const halfTax = totals.taxPct / 2;
    const halfAmt = totals.taxAmount / 2;
    drawRow(`CGST (${halfTax}%):`, fmt(halfAmt));
    drawRow(`SGST (${halfTax}%):`, fmt(halfAmt));
  }

  if (Math.abs(totals.roundOff) > 0.001) {
    drawRow('Round Off:', fmt(totals.roundOff));
  }

  doc.moveTo(RIGHT_LABEL_X, pdf.y).lineTo(RIGHT_VALUE_X, pdf.y).lineWidth(0.5).stroke('#CCCCCC');
  pdf.y += 5;

  drawRow('NET AMOUNT:', fmt(totals.netAmount), true);
}

// --- Section 7: Footer ---
export function renderFooter(pdf: PdfDocument, company: CompanyInfo): void {
  const doc = pdf.raw;
  const FOOTER_HEIGHT = 80;

  // Push footer to a fixed position near bottom if possible
  const footerY = Math.max(
    pdf.y + 20,
    pdf.pageHeight - pdf.marginBottom - FOOTER_HEIGHT,
  );

  pdf.y = footerY;

  doc.moveTo(pdf.marginLeft, pdf.y).lineTo(pdf.marginLeft + pdf.usableWidth, pdf.y).lineWidth(0.5).stroke('#CCCCCC');
  pdf.y += 10;

  const startY = pdf.y;
  const colWidth = pdf.usableWidth / 3;

  // Column 1: Bank Info
  doc.fontSize(8).font('Helvetica-Bold').text('Bank Details:', pdf.marginLeft, startY);
  doc.font('Helvetica');
  doc.text(`Bank: ${company.bankName || ''}`, pdf.marginLeft, startY + 12);
  doc.text(`A/c: ${company.bankAccount || ''}`, pdf.marginLeft, startY + 24);
  doc.text(`IFSC: ${company.bankIfsc || ''}`, pdf.marginLeft, startY + 36);

  // Column 2: Terms
  if (company.invoiceTerms) {
    doc.fontSize(8).font('Helvetica-Bold').text('Terms & Conditions:', pdf.marginLeft + colWidth, startY);
    doc.font('Helvetica').text(company.invoiceTerms, pdf.marginLeft + colWidth, startY + 12, { width: colWidth - 10 });
  }

  // Column 3: Signatory
  const signatoryX = pdf.pageWidth - pdf.marginRight - colWidth;
  doc.fontSize(8).font('Helvetica-Bold').text(`For ${company.name}`, signatoryX, startY, { align: 'right', width: colWidth });
  doc.text('Authorised Signatory', signatoryX, startY + 50, { align: 'right', width: colWidth });
}

// --- Section 8: Rule ---
export function renderRule(pdf: PdfDocument): void {
  pdf.raw.moveTo(pdf.marginLeft, pdf.y).lineTo(pdf.pageWidth - pdf.marginRight, pdf.y).stroke('#CCCCCC');
  pdf.y += 10;
}
