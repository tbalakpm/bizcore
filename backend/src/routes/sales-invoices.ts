import { and, eq, inArray, like, sql, type SQL } from 'drizzle-orm';
import express, { type Request, type Response } from 'express';
import { db, customers, inventories, products, salesInvoices, salesInvoiceItems, addresses, settings } from '../db';
import { renderSalesInvoice } from '../services/pdf/reports/sales-invoice.report';
import type { SalesInvoiceInput, SalesInvoiceItemModel } from '../models/sales-invoice.model';
import { serialNumberService } from '../services/serial-number.service';
import type { DbTransaction } from '../shared/serial-number.shared';
import { normalizeDate } from '../utils/date.util';
import { parsePagination, resolveSortDirection, toPagination } from '../utils/list-query.util';
import { toNumericString, toPositiveNumber } from '../utils/number.util';

export const salesInvoicesRouter = express.Router();

const processInvoiceItems = async (tx: DbTransaction, salesInvoiceId: number, items: Partial<SalesInvoiceItemModel>[]) => {
  let totalQty = 0;
  let subtotal = 0;
  let totalTax = 0;
  let totalDiscount = 0;

  for (const item of items) {
    const qty = toPositiveNumber(item.qty, 0);

    if (qty <= 0) {
      throw new Error('Item qty must be greater than zero');
    }

    const unitPrice = toPositiveNumber(item.unitPrice, 0);
    const lineTotal = toPositiveNumber(item.lineTotal, Number((qty * unitPrice).toFixed(2)));

    const inventoryId = item.inventoryId;
    if (!inventoryId) {
      throw new Error('Each item requires an inventoryId');
    }

    const inventory = await tx
      .select()
      .from(inventories)
      .where(eq(inventories.id, inventoryId))
      .get();
      
    if (!inventory) {
      throw new Error(`Inventory stock not found for inventoryId=${inventoryId}`);
    }
    
    if ((inventory.unitsInStock ?? 0) < qty) {
      throw new Error(`Insufficient stock for inventoryId=${inventoryId}`);
    }

    const updatedUnitsInStock = (inventory.unitsInStock ?? 0) - qty;
    await tx
      .update(inventories)
      .set({ unitsInStock: updatedUnitsInStock })
      .where(eq(inventories.id, inventory.id))
      .run();

    await tx
      .insert(salesInvoiceItems)
      .values({
        salesInvoiceId,
        inventoryId,
        qty: toNumericString(qty),
        unitPrice: toNumericString(unitPrice),
        discountType: item.discountType,
        discountPct: toNumericString(item.discountPct),
        discountAmount: toNumericString(item.discountAmount),
        taxPct: toNumericString(item.taxPct),
      })
      .run();

    totalQty += qty;
    subtotal += (qty * unitPrice);
    totalTax += toPositiveNumber(item.taxAmount, 0);
    totalDiscount += toPositiveNumber(item.discountAmount, 0);
  }

  return {
    totalQty,
    subtotal,
    totalTax,
    totalDiscount,
    netAmount: subtotal - totalDiscount + totalTax,
  };
};

salesInvoicesRouter.get('/', async (req: Request, res: Response) => {
  try {
    const { limit, offset, pageNum } = parsePagination({
      limit: req.query.limit as string | undefined,
      offset: req.query.offset as string | undefined,
      page: req.query.page as string | undefined,
      pageNum: req.query.pageNum as string | undefined,
    });

    const filters: SQL[] = [];
    if (req.query.invoiceNumber) {
      filters.push(like(salesInvoices.invoiceNumber, `%${req.query.invoiceNumber}%`));
    }

    if (req.query.invoiceDate) {
      filters.push(eq(salesInvoices.invoiceDate, req.query.invoiceDate as string));
    }

    if (req.query.customerId) {
      const customerId = Number(req.query.customerId);
      if (!Number.isNaN(customerId)) {
        filters.push(eq(salesInvoices.customerId, customerId));
      }
    }

    if (req.query.minAmount) {
      const minAmount = Number(req.query.minAmount);
      if (!Number.isNaN(minAmount)) {
        filters.push(sql`CAST(${salesInvoices.netAmount} AS REAL) >= ${minAmount}`);
      }
    }

    if (req.query.maxAmount) {
      const maxAmount = Number(req.query.maxAmount);
      if (!Number.isNaN(maxAmount)) {
        filters.push(sql`CAST(${salesInvoices.netAmount} AS REAL) <= ${maxAmount}`);
      }
    }

    const sortableFields = ['id', 'invoiceNumber', 'invoiceDate', 'totalQty', 'netAmount'] as const;
    type SortableField = (typeof sortableFields)[number];
    const isSortableField = (value: string): value is SortableField =>
      (sortableFields as readonly string[]).includes(value);

    const orderBy: SQL[] = [];
    if (req.query.sort) {
      const sortParams = (req.query.sort as string).split(',');
      for (const param of sortParams) {
        const [field, direction] = param.split(':');
        const dir = resolveSortDirection(direction);
        if (!field || !isSortableField(field)) {
          continue;
        }

        const column = salesInvoices[field];
        if (column) {
          orderBy.push(dir(column));
        }
      }
    }

    if (orderBy.length === 0) {
      orderBy.push(resolveSortDirection('desc')(salesInvoices.id));
    }

    const baseQuery = db
      .select({
        id: salesInvoices.id,
        invoiceNumber: salesInvoices.invoiceNumber,
        invoiceDate: salesInvoices.invoiceDate,
        customerId: salesInvoices.customerId,
        customerName: customers.name,
        totalQty: salesInvoices.totalQty,
        netAmount: salesInvoices.netAmount,
      })
      .from(salesInvoices)
      .leftJoin(customers, eq(customers.id, salesInvoices.customerId));
      
    const whereCondition = filters.length > 0 ? and(...filters) : undefined;
    const query = whereCondition ? baseQuery.where(whereCondition) : baseQuery;

    const totalResult = await db.select({ count: sql<number>`cast(count(*) as integer)` }).from(salesInvoices);
    const filteredCount = whereCondition
      ? (
          await db
            .select({ count: sql<number>`cast(count(*) as integer)` })
            .from(salesInvoices)
            .where(whereCondition)
        )[0].count
      : totalResult[0].count;

    const data = await query
      .orderBy(...orderBy)
      .limit(limit)
      .offset(offset)
      .all();

    res.json({
      data,
      pagination: toPagination(limit, offset, filteredCount, pageNum),
    });
  } catch (error) {
    console.error('Failed to fetch sales invoices', error);
    res.status(500).json({ error: 'Failed to fetch sales invoices' });
  }
});

salesInvoicesRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ error: 'Invalid sales invoice ID' });
    }

    const invoice = await db.select().from(salesInvoices).where(eq(salesInvoices.id, id)).get();
    if (!invoice) {
      return res.status(404).json({ error: 'Sales invoice not found' });
    }

    const items = await db
      .select({
        id: salesInvoiceItems.id,
        salesInvoiceId: salesInvoiceItems.salesInvoiceId,
        inventoryId: salesInvoiceItems.inventoryId,
        qty: salesInvoiceItems.qty,
        unitPrice: salesInvoiceItems.unitPrice,
        discountType: salesInvoiceItems.discountType,
        discountPct: salesInvoiceItems.discountPct,
        discountAmount: salesInvoiceItems.discountAmount,
        taxPct: salesInvoiceItems.taxPct,
        taxAmount: salesInvoiceItems.taxAmount,
        lineTotal: salesInvoiceItems.lineTotal,
        productId: inventories.productId,
        productCode: products.code,
        productName: products.name,
        unitsInStock: inventories.unitsInStock,
      })
      .from(salesInvoiceItems)
      .innerJoin(inventories, eq(inventories.id, salesInvoiceItems.inventoryId))
      .innerJoin(products, eq(products.id, inventories.productId))
      .where(eq(salesInvoiceItems.salesInvoiceId, id))
      .all();

    const customer = await db.select().from(customers).where(eq(customers.id, invoice.customerId)).get();

    return res.json({ ...invoice, customerName: customer?.name, items });
  } catch (error) {
    console.error('Failed to fetch sales invoice', error);
    return res.status(500).json({ error: 'Failed to fetch sales invoice' });
  }
});

salesInvoicesRouter.post('/', async (req: Request, res: Response) => {
  try {
    const body = req.body as SalesInvoiceInput;
    const items = body.items ?? [];

    if (items.length === 0) {
      return res.status(400).json({ error: 'At least one item is required' });
    }
    
    if (!body.customerId) {
        return res.status(400).json({ error: 'Customer is required for a sales invoice'});
    }

    const created = await db.transaction(async (tx) => {
      const invoiceNumber = body.invoiceNumber || (await serialNumberService.generateInvoiceNumber('salesInvoice', tx));
      const insertedInvoice = await tx
        .insert(salesInvoices)
        .values({
          invoiceNumber,
          invoiceDate: normalizeDate(body.invoiceDate),
          customerId: body.customerId!,
          refNumber: body.refNumber,
          refDate: body.refDate ? normalizeDate(body.refDate) : null,
          totalQty: toNumericString(body.totalQty) ?? '0',
          subtotal: toNumericString(body.subtotal) ?? '0',
          discountType: body.discountType,
          discountPct: toNumericString(body.discountPct),
          discountAmount: toNumericString(body.discountAmount),
          taxPct: toNumericString(body.taxPct),
        })
        .returning()
        .get();

      const totals = await processInvoiceItems(tx, insertedInvoice.id, items);

      // Overwrite with computed values if requested
      await tx
        .update(salesInvoices)
        .set({
          totalQty: toNumericString(body.totalQty) ?? toNumericString(totals.totalQty),
          subtotal: toNumericString(body.subtotal) ?? toNumericString(totals.subtotal),
          discountAmount: toNumericString(body.discountAmount) ?? toNumericString(totals.totalDiscount),
        })
        .where(eq(salesInvoices.id, insertedInvoice.id))
        .run();

      return tx.select().from(salesInvoices).where(eq(salesInvoices.id, insertedInvoice.id)).get();
    });

    return res.status(201).json(created);
  } catch (error) {
    console.error('Failed to create sales invoice', error);
    return res.status(400).json({ error: (error as Error).message || 'Failed to create sales invoice' });
  }
});

salesInvoicesRouter.put('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ error: 'Invalid sales invoice ID' });
    }

    const body = req.body as SalesInvoiceInput;
    const items = body.items ?? [];
    if (items.length === 0) {
      return res.status(400).json({ error: 'At least one item is required' });
    }

    const updated = await db.transaction(async (tx) => {
      const existing = await tx.select().from(salesInvoices).where(eq(salesInvoices.id, id)).get();
      if (!existing) {
        throw new Error('Sales invoice not found');
      }

      const existingItems = await tx
        .select()
        .from(salesInvoiceItems)
        .where(eq(salesInvoiceItems.salesInvoiceId, id))
        .all();
        
      if (existingItems.length > 0) {
        // Find corresponding inventory to refund the stock to. 
        for (const item of existingItems) {
           const inventory = await tx
              .select()
              .from(inventories)
              .where(eq(inventories.id, item.inventoryId))
              .get();
              
           if (inventory) {
               const qtyToReturn = Number(item.qty ?? 0);
               const restoredStock = (inventory.unitsInStock ?? 0) + qtyToReturn;
               
               await tx
                 .update(inventories)
                 .set({ unitsInStock: restoredStock })
                 .where(eq(inventories.id, inventory.id))
                 .run();
           }
        }

        await tx.delete(salesInvoiceItems).where(eq(salesInvoiceItems.salesInvoiceId, id)).run();
      }

      const totals = await processInvoiceItems(tx, id, items);

      await tx
        .update(salesInvoices)
        .set({
          invoiceNumber: body.invoiceNumber ?? existing.invoiceNumber,
          invoiceDate: body.invoiceDate ?? existing.invoiceDate,
          customerId: body.customerId ?? existing.customerId,
          refNumber: body.refNumber ?? existing.refNumber,
          refDate: body.refDate ? normalizeDate(body.refDate) : existing.refDate,
          totalQty: toNumericString(body.totalQty) ?? toNumericString(totals.totalQty),
          subtotal: toNumericString(body.subtotal) ?? toNumericString(totals.subtotal),
          discountType: body.discountType ?? existing.discountType,
          discountPct: toNumericString(body.discountPct) ?? existing.discountPct,
          discountAmount: toNumericString(body.discountAmount) ?? toNumericString(totals.totalDiscount),
          taxPct: toNumericString(body.taxPct) ?? existing.taxPct,
        })
        .where(eq(salesInvoices.id, id))
        .run();

      return tx.select().from(salesInvoices).where(eq(salesInvoices.id, id)).get();
    });

    return res.json(updated);
  } catch (error) {
    console.error('Failed to update sales invoice', error);
    return res.status(400).json({ error: (error as Error).message || 'Failed to update sales invoice' });
  }
});

salesInvoicesRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ error: 'Invalid sales invoice ID' });
    }

    await db.transaction(async (tx) => {
      const existing = await tx
        .select({ id: salesInvoices.id })
        .from(salesInvoices)
        .where(eq(salesInvoices.id, id))
        .get();
      if (!existing) {
        throw new Error('Sales invoice not found');
      }

      const items = await tx.select().from(salesInvoiceItems).where(eq(salesInvoiceItems.salesInvoiceId, id)).all();
      
      // Refund the inventory
      if (items.length > 0) {
        for (const item of items) {
           const inventory = await tx
              .select()
              .from(inventories)
              .where(eq(inventories.id, item.inventoryId))
              .get();
              
           if (inventory) {
               const qtyToReturn = Number(item.qty ?? 0);
               const restoredStock = (inventory.unitsInStock ?? 0) + qtyToReturn;
               
               await tx
                 .update(inventories)
                 .set({ unitsInStock: restoredStock })
                 .where(eq(inventories.id, inventory.id))
                 .run();
           }
        }
      }

      await tx.delete(salesInvoiceItems).where(eq(salesInvoiceItems.salesInvoiceId, id)).run();
      await tx.delete(salesInvoices).where(eq(salesInvoices.id, id)).run();
    });

    return res.status(204).send();
  } catch (error) {
    console.error('Failed to delete sales invoice', error);
    return res.status(404).json({ error: (error as Error).message || 'Failed to delete sales invoice' });
  }
});

import crypto from 'crypto';
import bwipjs from 'bwip-js';

salesInvoicesRouter.post('/:id/generate-irn', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ error: 'Invalid sales invoice ID' });
    }

    const existing = await db.select().from(salesInvoices).where(eq(salesInvoices.id, id)).get();
    if (!existing) {
      return res.status(404).json({ error: 'Sales invoice not found' });
    }
    
    // According to Indian Gov E-Invoicing Rules, an invoice cannot generate multiple IRNs.
    if (existing.irn) {
        return res.status(400).json({ error: 'Invoice already possesses an IRN.' });
    }

    // Mock IRN generation (normally involves calling NIC IRP portal with a JSON payload)
    // Here we generate a realistic-looking 64-char hex hash
    const inputString = existing.customerId + '-' + existing.invoiceNumber + '-' + existing.invoiceDate + '-' + Date.now();
    const irn = crypto.createHash('sha256').update(inputString).digest('hex');
    
    // Mock 15 digit Ack No
    const ackNo = Math.floor(100000000000000 + Math.random() * 900000000000000).toString();
    
    const ackDate = new Date().toISOString();
    
    // Fetch seller GSTIN from settings
    const settingRows = await db.select().from(settings).all();
    const s = Object.fromEntries(settingRows.map(r => [r.key, r.value]));

    // Mock Signed QR payload (usually a signed JWT-like string)
    const qrPayload = JSON.stringify({
       SellerGstin: s['company_gstin'] || '07AAGFF2194N1Z1',
       BuyerGstin: '27AADCB2230M1Z2',
       DocNo: existing.invoiceNumber,
       DocTyp: 'INV',
       DocDt: existing.invoiceDate,
       TotInvVal: existing.netAmount,
       ItemCnt: existing.totalQty,
       MainHsnCode: '8517',
       Irn: irn
    });
    
    // Base64 encode it for the QR code payload
    const signedQrCode = Buffer.from(qrPayload).toString('base64');

    await db
      .update(salesInvoices)
      .set({
         irn,
         ackNo,
         ackDate,
         signedQrCode
      })
      .where(eq(salesInvoices.id, id))
      .run();

    const updated = await db.select().from(salesInvoices).where(eq(salesInvoices.id, id)).get();

    return res.json(updated);
  } catch (error) {
    console.error('Failed to generate IRN', error);
    return res.status(500).json({ error: 'Failed to generate IRN' });
  }
});

// PDF Generation Route 
salesInvoicesRouter.get('/:id/pdf', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ error: 'Invalid sales invoice ID' });
    }

    await renderSalesInvoice(id, db, res);
  } catch (error) {
    console.error('Failed to generate sales invoice PDF', error);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
});
