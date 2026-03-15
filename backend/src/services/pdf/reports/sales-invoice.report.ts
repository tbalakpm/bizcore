import type { Response } from 'express';
import { eq } from 'drizzle-orm';
import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import { salesInvoices, salesInvoiceItems, customers, addresses, inventories, products } from '../../../db/schema';
import { PdfDocument } from '../engine/pdf-document';
import { fetchCompanyInfo, type TableColumn } from '../engine/pdf-types';
import * as sections from '../engine/pdf-sections';

export async function renderSalesInvoice(
  id: number,
  db: LibSQLDatabase<any>,
  res: Response,
): Promise<void> {
  const company = await fetchCompanyInfo(db);

  // 1. Fetch Invoice
  const invoice = await db.select().from(salesInvoices).where(eq(salesInvoices.id, id)).get();
  if (!invoice) throw new Error('Sales invoice not found');

  // 2. Fetch Customer & Addresses
  const customer = await db.select().from(customers).where(eq(customers.id, invoice.customerId)).get();
  let billingAddress = null;
  let shippingAddress = null;

  if (customer?.billingAddressId) {
    billingAddress = await db.select().from(addresses).where(eq(addresses.id, customer.billingAddressId)).get();
  }
  if (customer?.shippingAddressId) {
    shippingAddress = await db.select().from(addresses).where(eq(addresses.id, customer.shippingAddressId)).get();
  }

  // 3. Fetch Items
  const items = await db
    .select({
      qty: salesInvoiceItems.qty,
      unitPrice: salesInvoiceItems.unitPrice,
      discountAmount: salesInvoiceItems.discountAmount,
      taxPct: salesInvoiceItems.taxPct,
      taxAmount: salesInvoiceItems.taxAmount,
      lineTotal: salesInvoiceItems.lineTotal,
      productName: products.name,
      hsnSac: inventories.hsnSac,
    })
    .from(salesInvoiceItems)
    .innerJoin(inventories, eq(inventories.id, salesInvoiceItems.inventoryId))
    .innerJoin(products, eq(products.id, inventories.productId))
    .where(eq(salesInvoiceItems.salesInvoiceId, id))
    .all();

  // 4. Start Rendering
  const pdf = new PdfDocument(res);

  const onNewPage = () => {
    sections.renderCompanyHeader(pdf, company);
  };

  onNewPage();

  sections.renderReportMeta(pdf, {
    title: 'TAX INVOICE',
    number: invoice.invoiceNumber,
    date: invoice.invoiceDate,
    extraMeta: invoice.refNumber ? [{ label: 'Ref No', value: invoice.refNumber }] : [],
  });

  if (invoice.irn) {
    await sections.renderEInvoiceBlock(pdf, invoice.irn, invoice.ackNo, invoice.ackDate, invoice.signedQrCode);
  }

  sections.renderRule(pdf);

  if (customer) {
    const leftAddr = {
      name: customer.name,
      gstin: customer.gstin,
      line1: billingAddress?.addressLine1,
      city: billingAddress?.city,
      state: billingAddress?.state,
      postalCode: billingAddress?.postalCode,
      phone: billingAddress?.phone,
    };

    const rightAddr = shippingAddress ? {
      name: customer.name,
      line1: shippingAddress.addressLine1,
      city: shippingAddress.city,
      state: shippingAddress.state,
      postalCode: shippingAddress.postalCode,
      phone: shippingAddress.phone,
    } : undefined;

    sections.renderAddressBlock(pdf, leftAddr, rightAddr, 'BILL TO', 'SHIP TO');
  }

  sections.renderRule(pdf);

  const columns: TableColumn[] = [
    { header: '#', key: 'index', align: 'right', minWidth: 34, maxWidth: 34 },
    { header: 'Product', key: 'productName', align: 'left' },
    { header: 'HSN/SAC', key: 'hsnSac', align: 'left', maxWidth: 70 },
    { header: 'Qty', key: 'qty', align: 'right', maxWidth: 50, format: (v) => Number(v).toFixed(2) },
    { header: 'Rate', key: 'unitPrice', align: 'right', maxWidth: 75, format: (v) => Number(v).toFixed(2) },
    { header: 'Disc', key: 'discountAmount', align: 'right', maxWidth: 60, format: (v) => Number(v).toFixed(2) },
    { header: 'Tax%', key: 'taxPct', align: 'right', maxWidth: 45, format: (v) => Number(v).toFixed(2) },
    { header: 'Tax Amt', key: 'taxAmount', align: 'right', maxWidth: 70, format: (v) => Number(v).toFixed(2) },
    { header: 'Total', key: 'lineTotal', align: 'right', maxWidth: 80, format: (v) => Number(v).toFixed(2) },
  ];

  sections.renderItemsTable(pdf, columns, items, onNewPage);

  sections.renderTotals(pdf, {
    subtotal: Number(invoice.subtotal),
    discountAmount: Number(invoice.discountAmount),
    taxAmount: Number(invoice.taxAmount ?? 0),
    taxPct: Number(invoice.taxPct ?? 0),
    roundOff: Number(invoice.roundOff ?? 0),
    netAmount: Number(invoice.netAmount ?? 0),
  }, company);

  sections.renderFooter(pdf, company);

  pdf.end();
}
