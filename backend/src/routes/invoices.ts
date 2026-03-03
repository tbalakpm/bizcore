import { eq } from 'drizzle-orm';
import express from 'express';

import { db, salesInvoices, stockInvoices } from '../db';
import { serialNumberService } from '../services/serial-number.service';

export const invoicesRouter = express.Router();

invoicesRouter.get('/stock', async (_req, res) => {
  const data = await db.select().from(stockInvoices).orderBy(stockInvoices.id).all();
  res.json({ data });
});

invoicesRouter.get('/sales', async (_req, res) => {
  const data = await db.select().from(salesInvoices).orderBy(salesInvoices.id).all();
  res.json({ data });
});

invoicesRouter.post('/stock', async (req, res) => {
  const { invoiceDate, totalQty, totalAmount } = req.body;
  const invoiceNumber = await serialNumberService.generateInvoiceNumber('stockInvoice');

  const created = await db
    .insert(stockInvoices)
    .values({
      invoiceNumber,
      invoiceDate: invoiceDate || new Date().toISOString().slice(0, 10),
      totalQty: totalQty?.toString(),
      totalAmount: totalAmount?.toString(),
    })
    .returning()
    .get();

  res.status(201).json(created);
});

invoicesRouter.post('/sales', async (req, res) => {
  const {
    invoiceDate,
    customerId,
    refNumber,
    refDate,
    totalQty,
    subtotal,
    discountBy,
    discountPct,
    discountAmount,
    taxPct,
    taxAmount,
    netAmount,
  } = req.body;

  if (!customerId) {
    return res.status(400).json({ error: 'customerId is required' });
  }

  const invoiceNumber = await serialNumberService.generateInvoiceNumber('salesInvoice');
  const created = await db
    .insert(salesInvoices)
    .values({
      invoiceNumber,
      invoiceDate: invoiceDate || new Date().toISOString().slice(0, 10),
      customerId,
      refNumber,
      refDate,
      totalQty: totalQty?.toString(),
      subtotal: subtotal?.toString(),
      discountBy,
      discountPct: discountPct?.toString(),
      discountAmount: discountAmount?.toString(),
      taxPct: taxPct?.toString(),
      taxAmount: taxAmount?.toString(),
      netAmount: netAmount?.toString(),
    })
    .returning()
    .get();

  res.status(201).json(created);
});

invoicesRouter.get('/stock/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: 'Invalid stock invoice ID' });
  }

  const invoice = await db.select().from(stockInvoices).where(eq(stockInvoices.id, id)).get();
  if (!invoice) {
    return res.status(404).json({ error: 'Stock invoice not found' });
  }

  return res.json(invoice);
});

invoicesRouter.get('/sales/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: 'Invalid sales invoice ID' });
  }

  const invoice = await db.select().from(salesInvoices).where(eq(salesInvoices.id, id)).get();
  if (!invoice) {
    return res.status(404).json({ error: 'Sales invoice not found' });
  }

  return res.json(invoice);
});
