import PDFDocument from 'pdfkit';
import * as fs from 'fs';

interface LineItem {
  serialNo: number;
  productCode: string;
  productName: string;
  gtn?: string;
  hsnSac?: string;
  qty: number;
  rate: number;
  discount: number;
  tax: number;
}

interface Address {
  name: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

interface Invoice {
  invoiceNumber: string;
  invoiceDate: string;
  companyName: string;
  companyAddress: Address;
  billingAddress: Address;
  shippingAddress: Address;
  lineItems: LineItem[];
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
}

// @Injectable()
export class PrintSalesInvoiceService {
  generateInvoicePDF(invoice: Invoice, filePath: string): void {
    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    let pageNumber = 1;
    let currentY = 0;
    const pageHeight = 842;
    const topMargin = 40;
    const bottomMargin = 60;

    const addHeader = () => {
      currentY = topMargin;
      doc.fontSize(20).font('Helvetica-Bold').text(invoice.companyName, 50, currentY, { align: 'center' });
      currentY += 28;
      doc.fontSize(10).font('Helvetica').text(invoice.companyAddress.street, 50, currentY, { align: 'center' });
      currentY += 12;
      doc.text(
        `${invoice.companyAddress.city}, ${invoice.companyAddress.state} ${invoice.companyAddress.postalCode}`,
        50,
        currentY,
        { align: 'center' },
      );
      currentY += 12;
      doc.text(invoice.companyAddress.country, 50, currentY, { align: 'center' });
      currentY += 25;
    };

    const addAddresses = () => {
      const leftX = 50;
      const rightX = 320;
      doc.fontSize(10).font('Helvetica-Bold').text('BILLING ADDRESS', leftX, currentY);
      doc.text('SHIPPING ADDRESS', rightX, currentY);
      currentY += 15;

      doc.font('Helvetica').fontSize(9);
      doc.text(invoice.billingAddress.name, leftX, currentY);
      doc.text(invoice.shippingAddress.name, rightX, currentY);
      currentY += 12;
      doc.text(invoice.billingAddress.street, leftX, currentY);
      doc.text(invoice.shippingAddress.street, rightX, currentY);
      currentY += 12;
      doc.text(`${invoice.billingAddress.city}, ${invoice.billingAddress.state}`, leftX, currentY);
      doc.text(`${invoice.shippingAddress.city}, ${invoice.shippingAddress.state}`, rightX, currentY);
      currentY += 12;
      doc.text(invoice.billingAddress.postalCode, leftX, currentY);
      doc.text(invoice.shippingAddress.postalCode, rightX, currentY);
      currentY += 25;
    };

    const addTableHeader = () => {
      const columns = [
        { name: 'S.No', x: 50, width: 30 },
        // { name: 'Product Code', x: 95, width: 70 },
        { name: 'Product Name', x: 85, width: 150 },
        { name: 'Qty', x: 240, width: 40 },
        { name: 'Rate', x: 285, width: 50 },
        { name: 'Price', x: 340, width: 55 },
        { name: 'Discount', x: 400, width: 50 },
        { name: 'Tax', x: 455, width: 40 },
        { name: 'Total', x: 500, width: 60 },
      ];

      doc.fontSize(8).font('Helvetica-Bold').fillColor('#000');
      columns.forEach((col) => {
        doc.text(col.name, col.x, currentY, {
          width: col.width,
          align: col.name === 'Product Name' || col.name === 'S.No' ? 'left' : 'right',
        });
      });

      doc
        .moveTo(50, currentY + 12)
        .lineTo(560, currentY + 12)
        .stroke();
      currentY += 20;
    };

    const addLineItems = () => {
      invoice.lineItems.forEach((item) => {
        if (currentY > pageHeight - bottomMargin) {
          doc.addPage();
          pageNumber++;
          // addHeader();
          addTableHeader();
        }

        const price = item.qty * item.rate;
        const lineTotal = price - item.discount + item.tax;

        doc.fontSize(8).font('Helvetica').fillColor('#000');
        doc.text(item.serialNo.toString(), 50, currentY, { width: 20, align: 'right' });
        // doc.text(item.productCode, 95, currentY);
        doc.text(item.productName, 85, currentY, { width: 150, align: 'left' });
        doc.text(item.qty.toString(), 240, currentY, { width: 40, align: 'right' });
        doc.text(item.rate.toFixed(2), 285, currentY, { width: 50, align: 'right' });
        doc.text(price.toFixed(2), 340, currentY, { width: 55, align: 'right' });
        doc.text(item.discount.toFixed(2), 400, currentY, { width: 50, align: 'right' });
        doc.text(item.tax.toFixed(2), 455, currentY, { width: 40, align: 'right' });
        doc.text(lineTotal.toFixed(2), 500, currentY, { width: 60, align: 'right' });

        currentY += 15;
      });
    };

    const addFooter = () => {
      if (currentY > pageHeight - 120) {
        doc.addPage();
        pageNumber++;
        addHeader();
      }

      currentY = pageHeight - 120;
      doc.fontSize(9).font('Helvetica');
      doc.text('SUBTOTAL:', 400, currentY);
      doc.text(invoice.subtotal.toFixed(2), 520, currentY, { width: 40, align: 'right' });

      currentY += 15;
      doc.text('DISCOUNT:', 400, currentY);
      doc.text(invoice.discountAmount.toFixed(2), 520, currentY, { width: 40, align: 'right' });

      currentY += 15;
      doc.text('TAX:', 400, currentY);
      doc.text(invoice.taxAmount.toFixed(2), 520, currentY, { width: 40, align: 'right' });

      currentY += 18;
      doc.fontSize(12).text('NET AMOUNT:', 400, currentY);
      doc.text((invoice.subtotal - invoice.discountAmount + invoice.taxAmount).toFixed(2), 518, currentY, {
        width: 45,
        align: 'right',
      });

      doc
        .fontSize(8)
        .fillColor('#666')
        .text(`Page ${pageNumber}`, 50, pageHeight - 50, { align: 'center' });
    };

    addHeader();
    addAddresses();
    addTableHeader();
    addLineItems();
    addFooter();

    doc.end();
  }
}
