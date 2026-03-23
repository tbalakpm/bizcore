import type { Response } from 'express';
import { eq } from 'drizzle-orm';
import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import { purchaseInvoices, purchaseInvoiceItems, suppliers, addresses, inventories, products } from '../../../db/schema';
import { PdfDocument } from '../engine/pdf-document';
import { fetchCompanyInfo, type TableColumn } from '../engine/pdf-types';
import * as sections from '../engine/pdf-sections';

export async function renderPurchaseInvoice(
  id: number,
  db: LibSQLDatabase<any>,
  res: Response,
): Promise<void> {
  const company = await fetchCompanyInfo(db);

  // 1. Fetch Invoice
  const invoice = await db.select().from(purchaseInvoices).where(eq(purchaseInvoices.id, id)).get();
  if (!invoice) throw new Error('Purchase invoice not found');

  // 2. Fetch Supplier & Addresses
  const supplier = await db.select().from(suppliers).where(eq(suppliers.id, invoice.supplierId)).get();
  let billingAddress = null;
  let shippingAddress = null;

  if (supplier?.billingAddressId) {
    billingAddress = await db.select().from(addresses).where(eq(addresses.id, supplier.billingAddressId)).get();
  }
  if (supplier?.shippingAddressId) {
    shippingAddress = await db.select().from(addresses).where(eq(addresses.id, supplier.shippingAddressId)).get();
  }

  // 3. Fetch Items
  const items = await db
    .select({
      qty: purchaseInvoiceItems.qty,
      unitPrice: purchaseInvoiceItems.unitPrice,
      discountAmount: purchaseInvoiceItems.discountAmount,
      taxPct: purchaseInvoiceItems.taxPct,
      taxAmount: purchaseInvoiceItems.taxAmount,
      lineTotal: purchaseInvoiceItems.lineTotal,
      productName: products.name,
      hsnSac: inventories.hsnSac,
      gtn: inventories.gtn,
    })
    .from(purchaseInvoiceItems)
    .innerJoin(inventories, eq(inventories.id, purchaseInvoiceItems.inventoryId))
    .innerJoin(products, eq(products.id, inventories.productId))
    .where(eq(purchaseInvoiceItems.purchaseInvoiceId, id))
    .all();

  // 4. Start Rendering
  const pdf = new PdfDocument(res);

  sections.renderCompanyHeader(pdf, company);

  sections.renderReportMeta(pdf, {
    title: 'PURCHASE INVOICE',
    number: invoice.invoiceNumber,
    date: invoice.invoiceDate,
    extraMeta: invoice.refNumber ? [{ label: 'Ref No', value: invoice.refNumber }] : [],
  });

  sections.renderRule(pdf);

  if (supplier) {
    const leftAddr = {
      name: supplier.name,
      gstin: supplier.gstin,
      line1: billingAddress?.addressLine1,
      city: billingAddress?.city,
      state: billingAddress?.state,
      postalCode: billingAddress?.postalCode,
      phone: billingAddress?.phone,
    };

    const rightAddr = shippingAddress ? {
      name: supplier.name,
      line1: shippingAddress.addressLine1,
      city: shippingAddress.city,
      state: shippingAddress.state,
      postalCode: shippingAddress.postalCode,
      phone: shippingAddress.phone,
    } : undefined;

    sections.renderAddressBlock(pdf, leftAddr, rightAddr, 'SUPPLIER', 'SHIP TO');
  }

  sections.renderRule(pdf);

  const columns: TableColumn[] = [
    { header: '#', key: 'index', align: 'right', minWidth: 34, maxWidth: 34 },
    { header: 'Product', key: 'productName', align: 'left' },
    { header: 'HSN/SAC', key: 'hsnSac', align: 'left', maxWidth: 70 },
    { header: 'GTN', key: 'gtn', align: 'left', maxWidth: 90 },
    { header: 'Qty', key: 'qty', align: 'right', maxWidth: 50, format: (v) => Number(v).toFixed(2) },
    { header: 'Rate', key: 'unitPrice', align: 'right', maxWidth: 75, format: (v) => Number(v).toFixed(2) },
    { header: 'Tax%', key: 'taxPct', align: 'right', maxWidth: 45, format: (v) => Number(v).toFixed(2) },
    { header: 'Tax Amt', key: 'taxAmount', align: 'right', maxWidth: 70, format: (v) => Number(v).toFixed(2) },
    { header: 'Total', key: 'lineTotal', align: 'right', maxWidth: 80, format: (v) => Number(v).toFixed(2) },
  ];

  sections.renderItemsTable(pdf, columns, items);

  // Calculate totals if not in main invoice (or use main invoice if accurate)
  sections.renderTotals(pdf, {
    subtotal: Number(invoice.subtotal),
    discountAmount: Number(invoice.discountAmount),
    taxAmount: Number(invoice.totalTaxAmount ?? 0),
    taxPct: 0,
    roundOff: Number(invoice.roundOff ?? 0),
    netAmount: Number(invoice.netAmount ?? 0),
  }, company);

  sections.renderFooter(pdf, company);

  await pdf.end();
}
