import PDFDocument from 'pdfkit';
import { Response } from 'express';
import bwipjs from 'bwip-js';

export interface Address {
  addressLine1?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country?: string | null;
}

export interface SalesInvoicePdfData {
  invoice: {
    invoiceNumber: string;
    invoiceDate: string;
    refNumber?: string | null;
    subtotal: string | number;
    discountAmount: string | number;
    taxAmount: string | number;
    roundOff: string | number;
    netAmount: string | number;
    // E-Invoice fields
    irn?: string | null;
    ackNo?: string | null;
    ackDate?: string | null;
    signedQrCode?: string | null;
  };
  company: {
    name: string;
    gstin: string;
    addressLine1?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    phone?: string;
    bankName?: string;
    bankAccount?: string;
    bankIfsc?: string;
    invoiceTerms?: string;
    sgstSharingRate?: number;
    igstSharingRate?: number;
  };
  customer: {
    name: string;
    gstin?: string | null;
    billingAddress?: Address | null;
    shippingAddress?: Address | null;
  } | null;
  items: {
    productName: string;
    hsnSac?: string | null;
    qty: string | number;
    unitPrice: string | number;
    discountAmount: string | number;
    taxPct: string | number;
    taxAmount: string | number;
    lineTotal: string | number;
  }[];
}

export class PrintSalesInvoiceService {
  async generatePDF(data: SalesInvoicePdfData, res: Response): Promise<void> {
    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    doc.pipe(res);

    let currentY = 40;
    const pageBottom = 720;

    const checkPageWrap = (heightNeeded: number) => {
      if (currentY + heightNeeded > pageBottom) {
        doc.addPage();
        currentY = 40;
        return true;
      }
      return false;
    };

    // 1. Company Header
    const drawHeader = () => {
      doc.fontSize(18).font('Helvetica-Bold').text(data.company.name.toUpperCase(), 40, currentY, { align: 'center' });
      currentY += 22;
      
      const addrLines = [
        data.company.addressLine1,
        [data.company.city, data.company.state, data.company.postalCode].filter(Boolean).join(' '),
      ].filter(Boolean);
      
      doc.fontSize(9).font('Helvetica').text(addrLines.join(', '), 40, currentY, { align: 'center' });
      currentY += 12;
      
      const contactLines = [
        data.company.gstin ? `GSTIN: ${data.company.gstin}` : null,
        data.company.phone ? `Phone: ${data.company.phone}` : null,
      ].filter(Boolean);
      
      doc.text(contactLines.join('  |  '), 40, currentY, { align: 'center' });
      currentY += 15;
      
      doc.moveTo(40, currentY).lineTo(555, currentY).stroke('#CCCCCC');
      currentY += 15;
    };

    drawHeader();

    // 2. Title + Invoice Meta
    doc.fontSize(14).font('Helvetica-Bold').text('TAX INVOICE', 40, currentY);
    
    doc.fontSize(9).font('Helvetica-Bold').text('Invoice No:', 380, currentY);
    doc.font('Helvetica').text(data.invoice.invoiceNumber, 450, currentY);
    currentY += 12;
    
    doc.font('Helvetica-Bold').text('Invoice Date:', 380, currentY);
    doc.font('Helvetica').text(data.invoice.invoiceDate, 450, currentY);
    currentY += 12;

    if (data.invoice.refNumber) {
      doc.font('Helvetica-Bold').text('Ref No:', 380, currentY);
      doc.font('Helvetica').text(data.invoice.refNumber, 450, currentY);
      currentY += 12;
    }
    currentY += 10;

    // 3. E-Invoice Block
    if (data.invoice.irn) {
      doc.fontSize(8).font('Helvetica-Bold').text('IRN:', 40, currentY);
      doc.font('Helvetica').text(data.invoice.irn, 70, currentY, { width: 300 });
      
      const irnHeight = doc.heightOfString(data.invoice.irn, { width: 300 });
      
      if (data.invoice.signedQrCode) {
        try {
          const qrPng = await bwipjs.toBuffer({
            bcid: 'qrcode',
            text: data.invoice.signedQrCode,
            scale: 2,
          });
          doc.image(qrPng, 480, currentY - 20, { width: 65 });
        } catch (e) {
          console.error('QR Gen failed', e);
        }
      }
      
      currentY += irnHeight + 5;
      doc.font('Helvetica-Bold').text('Ack No:', 40, currentY);
      doc.font('Helvetica').text(data.invoice.ackNo || '', 80, currentY);
      doc.font('Helvetica-Bold').text('Ack Date:', 180, currentY);
      doc.font('Helvetica').text(data.invoice.ackDate || '', 230, currentY);
      currentY += 15;
    }

    // 4. Customer Block
    const formatAddress = (addr?: Address | null) => {
      if (!addr) return '';
      return [
        addr.addressLine1,
        [addr.city, addr.state, addr.postalCode].filter(Boolean).join(' '),
        addr.country
      ].filter(Boolean).join('\n');
    };

    const isSameAddr = JSON.stringify(data.customer?.billingAddress) === JSON.stringify(data.customer?.shippingAddress);

    doc.fontSize(9).font('Helvetica-Bold').text('BILL TO', 40, currentY);
    if (!isSameAddr) {
      doc.text('SHIP TO', 300, currentY);
    }
    currentY += 12;

    doc.font('Helvetica').text(data.customer?.name || '', 40, currentY);
    if (!isSameAddr) {
      doc.text(data.customer?.name || '', 300, currentY);
    }
    currentY += 12;

    if (data.customer?.gstin) {
      doc.text(`GSTIN: ${data.customer.gstin}`, 40, currentY);
      if (!isSameAddr) {
        doc.text(`GSTIN: ${data.customer.gstin}`, 300, currentY);
      }
      currentY += 12;
    }

    const billingText = formatAddress(data.customer?.billingAddress);
    const shippingText = formatAddress(data.customer?.shippingAddress);

    const addrY = currentY;
    doc.text(billingText, 40, addrY, { width: 250 });
    if (!isSameAddr) {
      doc.text(shippingText, 300, addrY, { width: 250 });
    }
    
    currentY = Math.max(
      doc.y,
      addrY + (isSameAddr ? 0 : 0) // placeholder
    ) + 20;

    // 5. Items Table
    const tableHeader = () => {
      doc.rect(40, currentY, 515, 20).fill('#CCCCCC');
      doc.fontSize(9).font('Helvetica-Bold').fillColor('#000000');
      
      doc.text('#', 45, currentY + 5, { width: 20 });
      doc.text('Product', 70, currentY + 5, { width: 160 });
      doc.text('HSN', 235, currentY + 5, { width: 50 });
      doc.text('Qty', 290, currentY + 5, { width: 35, align: 'right' });
      doc.text('Rate', 330, currentY + 5, { width: 50, align: 'right' });
      doc.text('Disc', 385, currentY + 5, { width: 40, align: 'right' });
      doc.text('Tax%', 430, currentY + 5, { width: 30, align: 'right' });
      doc.text('Tax Amt', 465, currentY + 5, { width: 45, align: 'right' });
      doc.text('Total', 515, currentY + 5, { width: 40, align: 'right' });
      
      currentY += 25;
    };

    tableHeader();

    let rowIndex = 0;
    for (const item of data.items) {
      checkPageWrap(20);
      if (currentY === 40) {
        tableHeader();
      }

      if (rowIndex % 2 === 1) {
        doc.rect(40, currentY - 2, 515, 18).fill('#F7F7F7');
      }
      doc.fillColor('#000000').font('Helvetica').fontSize(9);

      doc.text((rowIndex + 1).toString(), 45, currentY, { width: 20 });
      doc.text(item.productName, 70, currentY, { width: 160 });
      doc.text(item.hsnSac || '', 235, currentY, { width: 50 });
      doc.text(Number(item.qty).toFixed(2), 290, currentY, { width: 35, align: 'right' });
      doc.text(Number(item.unitPrice).toFixed(2), 330, currentY, { width: 50, align: 'right' });
      doc.text(Number(item.discountAmount).toFixed(2), 385, currentY, { width: 40, align: 'right' });
      doc.text(Number(item.taxPct).toFixed(2), 430, currentY, { width: 30, align: 'right' });
      doc.text(Number(item.taxAmount).toFixed(2), 465, currentY, { width: 45, align: 'right' });
      doc.text(Number(item.lineTotal).toFixed(2), 515, currentY, { width: 40, align: 'right' });

      currentY += 18;
      rowIndex++;
    }

    // 6. Totals Block
    checkPageWrap(120);
    currentY += 10;
    const totalsX = 380;
    const valueX = 500;

    doc.fontSize(9).font('Helvetica');
    
    doc.text('Subtotal:', totalsX, currentY);
    doc.text(Number(data.invoice.subtotal).toFixed(2), valueX, currentY, { align: 'right', width: 55 });
    currentY += 15;

    if (Number(data.invoice.discountAmount) > 0) {
      doc.text('Discount:', totalsX, currentY);
      doc.text(`- ${Number(data.invoice.discountAmount).toFixed(2)}`, valueX, currentY, { align: 'right', width: 55 });
      currentY += 15;
    }

    doc.text('Taxable Amount:', totalsX, currentY);
    doc.text((Number(data.invoice.subtotal) - Number(data.invoice.discountAmount)).toFixed(2), valueX, currentY, { align: 'right', width: 55 });
    currentY += 15;

    // CGST/SGST/IGST Split
    const sgstRate = data.company.sgstSharingRate ?? 50;
    const igstRate = data.company.igstSharingRate ?? 0;
    const taxAmt = Number(data.invoice.taxAmount);

    if (igstRate === 100) {
      doc.text('IGST:', totalsX, currentY);
      doc.text(taxAmt.toFixed(2), valueX, currentY, { align: 'right', width: 55 });
      currentY += 15;
    } else {
      const splitAmt = (taxAmt * sgstRate) / 100;
      doc.text('CGST:', totalsX, currentY);
      doc.text(splitAmt.toFixed(2), valueX, currentY, { align: 'right', width: 55 });
      currentY += 15;
      doc.text('SGST:', totalsX, currentY);
      doc.text(splitAmt.toFixed(2), valueX, currentY, { align: 'right', width: 55 });
      currentY += 15;
    }

    if (Number(data.invoice.roundOff) !== 0) {
      doc.text('Round Off:', totalsX, currentY);
      doc.text(Number(data.invoice.roundOff).toFixed(2), valueX, currentY, { align: 'right', width: 55 });
      currentY += 15;
    }

    doc.moveTo(totalsX, currentY).lineTo(555, currentY).stroke('#CCCCCC');
    currentY += 5;
    
    doc.font('Helvetica-Bold').fontSize(11);
    doc.text('NET AMOUNT:', totalsX, currentY);
    doc.text(Number(data.invoice.netAmount).toFixed(2), valueX, currentY, { align: 'right', width: 55 });
    currentY += 25;

    // 7. Footer
    const drawFooter = () => {
      currentY = 740;
      doc.moveTo(40, currentY).lineTo(555, currentY).stroke('#CCCCCC');
      currentY += 10;
      
      // Bank Info
      doc.fontSize(8).font('Helvetica-Bold').text('Bank Details:', 40, currentY);
      doc.font('Helvetica');
      doc.text(`Bank: ${data.company.bankName || ''}`, 40, currentY + 10);
      doc.text(`A/c: ${data.company.bankAccount || ''}`, 40, currentY + 20);
      doc.text(`IFSC: ${data.company.bankIfsc || ''}`, 40, currentY + 30);
      
      // Terms
      if (data.company.invoiceTerms) {
        doc.font('Helvetica-Bold').text('Terms & Conditions:', 200, currentY);
        doc.font('Helvetica').text(data.company.invoiceTerms, 200, currentY + 10, { width: 180 });
      }
      
      // Signatory
      doc.font('Helvetica-Bold').text(`For ${data.company.name}`, 400, currentY, { align: 'right', width: 155 });
      doc.text('Authorised Signatory', 400, currentY + 45, { align: 'right', width: 155 });
    };

    drawFooter();

    doc.end();
  }
}
