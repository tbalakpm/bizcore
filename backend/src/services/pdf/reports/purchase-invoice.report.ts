import type { Response } from 'express';
import { eq } from 'drizzle-orm';
import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import { purchaseInvoices, purchaseInvoiceItems, suppliers, addresses, inventories, products } from '../../../db/schema';
import { PdfDocument } from '../engine/pdf-document';
import { fetchCompanyInfo, type TableColumn } from '../engine/pdf-types';
import * as sections from '../engine/pdf-sections';
import { DateUtil } from '../../../utils/date.util';

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
      cgstAmount: purchaseInvoiceItems.cgstAmount,
      sgstAmount: purchaseInvoiceItems.sgstAmount,
      igstAmount: purchaseInvoiceItems.igstAmount,
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
    date: DateUtil.formatDDMMYYYY(invoice.invoiceDate),
    extraMeta: invoice.refNumber ? [{ label: 'Ref No', value: invoice.refNumber + (invoice.refDate ? ` dt ${DateUtil.formatDDMMYYYY(invoice.refDate)}` : "") }] : [],
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
    { header: '#', key: 'index', align: 'right', width: 'auto' },
    { header: 'Product', key: 'productName', align: 'left', width: '*' },
    { header: 'HSN/SAC', key: 'hsnSac', align: 'left', width: 'auto' },
    { header: 'GTN', key: 'gtn', align: 'left', width: 'auto' },
    { header: 'Qty', key: 'qty', align: 'right', width: 'auto', format: (v) => Number(v).toFixed(2) },
    { header: 'Rate', key: 'unitPrice', align: 'right', width: 'auto', format: (v) => Number(v).toFixed(2) },
    { header: 'Tax%', key: 'taxPct', align: 'right', width: 'auto', format: (v) => Number(v).toFixed(2) },
    { header: 'Tax Amt', key: 'taxAmount', align: 'right', width: 'auto', format: (v) => Number(v).toFixed(2) },
    { header: 'Total', key: 'lineTotal', align: 'right', width: 'auto', format: (v) => Number(v).toFixed(2) },
  ];

  const hsnMap = new Map<string, any>();
  for (const item of items) {
    const hsn = item.hsnSac || 'NA';
    const taxableValue = (Number(item.qty) * Number(item.unitPrice)) - Number(item.discountAmount);
    if (!hsnMap.has(hsn)) {
      hsnMap.set(hsn, {
        hsnSac: hsn,
        taxableValue: 0,
        taxPct: Number(item.taxPct).toFixed(0),
        cgstAmount: 0,
        sgstAmount: 0,
        igstAmount: 0,
      });
    }
    const hsnRow = hsnMap.get(hsn)!;
    hsnRow.taxableValue += taxableValue;
    hsnRow.cgstAmount += Number(item.cgstAmount);
    hsnRow.sgstAmount += Number(item.sgstAmount);
    hsnRow.igstAmount += Number(item.igstAmount);
  }
  const hsnSummary = Array.from(hsnMap.values());

  const totalCgst = items.reduce((sum, i) => sum + Number(i.cgstAmount), 0);
  const totalSgst = items.reduce((sum, i) => sum + Number(i.sgstAmount), 0);
  const totalIgst = items.reduce((sum, i) => sum + Number(i.igstAmount), 0);

  sections.renderItemsTable(pdf, columns, items);

  // 4. Totals
  sections.renderTotals(pdf, {
    taxableAmount: Number(invoice.subtotal) - Number(invoice.discountAmount),
    cgstAmount: totalCgst,
    sgstAmount: totalSgst,
    igstAmount: totalIgst,
    roundOff: Number(invoice.roundOff ?? 0),
    netAmount: Number(invoice.netAmount ?? 0),
  }, company, hsnSummary);

  sections.renderFooter(pdf, company);

  await pdf.end();
}
