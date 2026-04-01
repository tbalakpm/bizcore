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
      sgstAmount: salesInvoiceItems.sgstAmount,
      cgstAmount: salesInvoiceItems.cgstAmount,
      igstAmount: salesInvoiceItems.igstAmount,
      lineTotal: salesInvoiceItems.lineTotal,
      productName: products.name,
      gtn: inventories.gtn,
      uom: products.qtyPerUnit,
      hsnSac: products.hsnSac,
    })
    .from(salesInvoiceItems)
    .innerJoin(inventories, eq(inventories.id, salesInvoiceItems.inventoryId))
    .innerJoin(products, eq(products.id, inventories.productId))
    .where(eq(salesInvoiceItems.salesInvoiceId, id))
    .all();

  const formattedItems = items.map(item => {
    // const qty = Number(item.qty) || 1;
    const price = Number(item.unitPrice) * Number(item.qty) - Number(item.discountAmount);
    return {
      ...item,
      productName: item.gtn ? `${item.productName} - ${item.gtn}` : item.productName,
      unitPrice: price,
      taxPctAndAmount: `${Number(item.taxPct).toFixed(0)}% - ${Number(item.taxAmount).toFixed(2)}`
    };
  });

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

  // 4. Start Rendering
  const pdf = new PdfDocument(res);

  sections.renderCompanyHeader(pdf, company);

  sections.renderReportMeta(pdf, {
    title: invoice.type === 'invoice' ? 'TAX INVOICE' : 'ESTIMATE',
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

  const isEstimate = invoice.type === 'estimate';
  const columns: TableColumn[] = [
    { header: '#', key: 'index', align: 'right', width: 'auto' },
    { header: 'Product', key: 'productName', align: 'left', width: '*' },
    { header: 'HSN/SAC', key: 'hsnSac', align: 'left', width: 'auto' },
    { header: 'Qty', key: 'qty', align: 'right', width: 'auto', format: (v) => Number(v).toFixed(2) },
    { header: 'Price', key: 'unitPrice', align: 'right', width: 'auto', format: (v) => Number(v).toFixed(2) },
    ...(isEstimate ? [] : [{ header: 'Tax', key: 'taxPctAndAmount', align: 'right' as const, width: 'auto' as const }]),
    { header: 'Total', key: 'lineTotal', align: 'right', width: 'auto', format: (v) => Number(v).toFixed(2) },
  ] as TableColumn[];

  sections.renderItemsTable(pdf, columns, formattedItems);

  sections.renderTotals(
    pdf,
    {
      taxableAmount: Number(invoice.subtotal) - Number(invoice.discountAmount),
      cgstAmount: totalCgst,
      sgstAmount: totalSgst,
      igstAmount: totalIgst,
      roundOff: Number(invoice.roundOff ?? 0),
      netAmount: Number(invoice.netAmount ?? 0),
    },
    company,
    hsnSummary,
    isEstimate
  );

  sections.renderFooter(pdf, company);

  await pdf.end();
}
