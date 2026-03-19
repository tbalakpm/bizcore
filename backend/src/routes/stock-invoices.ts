import { and, eq, inArray, like, sql, type SQL } from 'drizzle-orm';
import express, { type Request, type Response } from 'express';

import { db, inventories, products, stockInvoiceItems, stockInvoices } from '../db';
import type { StockInvoiceItemModel, StockInvoiceModel } from '../models/stock-invoice.model';
import { serialNumberService } from '../services/serial-number.service';
import { ProductSerialMode, productSerialNumberService } from '../services/product-serial-number.service';
import type { DbTransaction } from '../shared/serial-number.shared';
import { parsePagination, resolveSortDirection, toPagination } from '../utils/list-query.util';
import { normalizeDate } from '../utils/date.util';
import { toNumericString, toPositiveNumber } from '../utils/number.util';
import { generateGtn, shouldGenerateGtn } from '../utils/gtn.util';

// barcode printing support
import PDFDocument from 'pdfkit';
import bwipjs from 'bwip-js';

// model used for building labels
interface PrintableBarcodeLabel {
  title: string;
  code: string;
  subtitle: string;
}

type StockInvoiceItemInput = Partial<StockInvoiceItemModel>;

type StockInvoiceInput = Partial<Omit<StockInvoiceModel, 'items'>> & { items?: StockInvoiceItemInput[] };

export const stockInvoicesRouter = express.Router();

const processInvoiceItems = async (tx: DbTransaction, stockInvoiceId: number, items: StockInvoiceItemInput[]) => {
  let totalQty = 0;
  let totalAmount = 0;

  for (const item of items) {
    const qty = toPositiveNumber(item.qty, 0);

    if (qty <= 0) {
      throw new Error('Item qty must be greater than zero');
    }

    const unitPriceRaw = item.unitPrice ?? 0;
    const unitPrice = toPositiveNumber(unitPriceRaw, 0);
    const lineTotal = toPositiveNumber(item.lineTotal, Number((qty * unitPrice).toFixed(2)));

    let inventoryId = item.inventoryId;

    if (!inventoryId) {
      if (!item.productId) {
        throw new Error('Each item requires either inventoryId or productId');
      }

      const product = await tx.select().from(products).where(eq(products.id, item.productId)).get();
      if (!product) {
        throw new Error(`Product not found for productId=${item.productId}`);
      }

      if (item.gtn) {
        // Manual GTN provided
        const createdInventory = await tx
          .insert(inventories)
          .values({
            productId: product.id,
            gtn: item.gtn,
            qtyPerUnit: product.qtyPerUnit,
            hsnSac: item.hsnSac ?? product.hsnSac,
            taxRate: toNumericString(item.taxRate) ?? product.taxRate,
            buyingPrice: toNumericString(unitPrice) ?? product.unitPrice,
            sellingPrice: item.sellingPrice ? toNumericString(item.sellingPrice) : product.unitPrice,
            unitsInStock: qty,
            location: item.location,
          })
          .returning({ id: inventories.id })
          .get();

        await tx
          .insert(stockInvoiceItems)
          .values({
            stockInvoiceId,
            inventoryId: createdInventory.id,
            qty: toNumericString(qty),
            unitPrice: toNumericString(unitPrice),
            marginType: item.marginType ?? 'none',
            marginPct: toNumericString(item.marginPct) ?? '0',
            marginAmount: toNumericString(item.marginAmount) ?? '0',
            sellingPrice: toNumericString(item.sellingPrice) ?? '0',
          })
          .run();
      } else {
        // Auto GTN Generation logic
        const genType = (product.gtnGeneration || 'CODE').toUpperCase();

        if (genType === 'TAG') {
          // TAG: Each quantity gets a distinct inventory row with qty 1
          for (let i = 0; i < qty; i++) {
            const generatedGtn = await productSerialNumberService.generateTagNumber(product.id, product.gtnMode as ProductSerialMode, tx);
            const createdInventory = await tx
              .insert(inventories)
              .values({
                productId: product.id,
                gtn: generatedGtn,
                qtyPerUnit: product.qtyPerUnit,
                hsnSac: item.hsnSac ?? product.hsnSac,
                taxRate: toNumericString(item.taxRate) ?? product.taxRate,
                buyingPrice: toNumericString(unitPrice) ?? product.unitPrice,
                sellingPrice: item.sellingPrice ? toNumericString(item.sellingPrice) : product.unitPrice,
                unitsInStock: 1,
                location: item.location,
              })
              .returning({ id: inventories.id })
              .get();

            await tx
              .insert(stockInvoiceItems)
              .values({
                stockInvoiceId,
                inventoryId: createdInventory.id,
                qty: '1',
                unitPrice: toNumericString(unitPrice),
                marginType: item.marginType ?? 'none',
                marginPct: toNumericString(item.marginPct) ?? '0',
                marginAmount: toNumericString(item.marginAmount) ?? '0',
                sellingPrice: toNumericString(item.sellingPrice) ?? '0',
              })
              .run();
          }
        } else {
          // CODE or BATCH or anything else: 1 row for the full quantity
          let generatedGtn: string | undefined = undefined;
          if (genType === 'BATCH') {
            generatedGtn = await productSerialNumberService.generateBatchNumber(product.id, product.gtnMode as ProductSerialMode, tx);
          } else if (genType === 'CODE') {
            generatedGtn = product.code;
          } else if (shouldGenerateGtn(product.gtnGeneration)) {
            generatedGtn = generateGtn(product.code);
          }

          const createdInventory = await tx
            .insert(inventories)
            .values({
              productId: product.id,
              gtn: generatedGtn,
              qtyPerUnit: product.qtyPerUnit,
              hsnSac: item.hsnSac ?? product.hsnSac,
              taxRate: toNumericString(item.taxRate) ?? product.taxRate,
              buyingPrice: toNumericString(unitPrice) ?? product.unitPrice,
              sellingPrice: item.sellingPrice ? toNumericString(item.sellingPrice) : product.unitPrice,
              unitsInStock: qty,
              location: item.location,
            })
            .returning({ id: inventories.id })
            .get();

          await tx
            .insert(stockInvoiceItems)
            .values({
              stockInvoiceId,
              inventoryId: createdInventory.id,
              qty: toNumericString(qty),
              unitPrice: toNumericString(unitPrice),
              marginType: item.marginType ?? 'none',
              marginPct: toNumericString(item.marginPct) ?? '0',
              marginAmount: toNumericString(item.marginAmount) ?? '0',
              sellingPrice: toNumericString(item.sellingPrice) ?? '0',
            })
            .run();
        }
      }
    } else {
      // Appending to an existing inventoryId
      const inventory = await tx.select().from(inventories).where(eq(inventories.id, inventoryId)).get();
      if (!inventory) {
        throw new Error(`Inventory not found for inventoryId=${inventoryId}`);
      }

      const updatedUnitsInStock = (inventory.unitsInStock ?? 0) + qty;
      const updatingPayload: any = { unitsInStock: updatedUnitsInStock };
      if (item.sellingPrice !== undefined) {
        updatingPayload.sellingPrice = toNumericString(item.sellingPrice);
      }

      await tx
        .update(inventories)
        .set(updatingPayload)
        .where(eq(inventories.id, inventory.id))
        .run();

      await tx
        .insert(stockInvoiceItems)
        .values({
          stockInvoiceId,
          inventoryId: inventory.id,
          qty: toNumericString(qty),
          unitPrice: toNumericString(unitPrice),
          marginType: item.marginType ?? 'none',
          marginPct: toNumericString(item.marginPct) ?? '0',
          marginAmount: toNumericString(item.marginAmount) ?? '0',
          sellingPrice: toNumericString(item.sellingPrice) ?? '0',
        })
        .run();
    }

    totalQty += qty;
    totalAmount += lineTotal;
  }

  return {
    totalQty,
    totalAmount,
  };
};

stockInvoicesRouter.get('/', async (req: Request, res: Response) => {
  try {
    const { limit, offset, pageNum } = parsePagination({
      limit: req.query.limit as string | undefined,
      offset: req.query.offset as string | undefined,
      page: req.query.page as string | undefined,
      pageNum: req.query.pageNum as string | undefined,
    });

    const filters: SQL[] = [];
    if (req.query.invoiceNumber) {
      filters.push(like(stockInvoices.invoiceNumber, `%${req.query.invoiceNumber}%`));
    }

    if (req.query.invoiceDate) {
      filters.push(eq(stockInvoices.invoiceDate, req.query.invoiceDate as string));
    }

    if (req.query.minAmount) {
      const minAmount = Number(req.query.minAmount);
      if (!Number.isNaN(minAmount)) {
        filters.push(sql`CAST(${stockInvoices.totalAmount} AS REAL) >= ${minAmount}`);
      }
    }

    if (req.query.maxAmount) {
      const maxAmount = Number(req.query.maxAmount);
      if (!Number.isNaN(maxAmount)) {
        filters.push(sql`CAST(${stockInvoices.totalAmount} AS REAL) <= ${maxAmount}`);
      }
    }

    const sortableFields = ['id', 'invoiceNumber', 'invoiceDate', 'totalQty', 'totalAmount'] as const;
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

        const column = stockInvoices[field];
        if (column) {
          orderBy.push(dir(column));
        }
      }
    }

    if (orderBy.length === 0) {
      orderBy.push(resolveSortDirection('desc')(stockInvoices.id));
    }

    const baseQuery = db.select().from(stockInvoices);
    const whereCondition = filters.length > 0 ? and(...filters) : undefined;
    const query = whereCondition ? baseQuery.where(whereCondition) : baseQuery;

    const totalResult = await db.select({ count: sql<number>`cast(count(*) as integer)` }).from(stockInvoices);
    const filteredCount = whereCondition
      ? (
        await db
          .select({ count: sql<number>`cast(count(*) as integer)` })
          .from(stockInvoices)
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
    console.error('Failed to fetch stock invoices', error);
    res.status(500).json({ error: 'Failed to fetch stock invoices' });
  }
});

// helper for barcode labels used by both json and pdf endpoints
const buildBarcodeLabels = (invoice: {
  items?: Array<Partial<Omit<StockInvoiceItemModel, 'qty' | 'unitPrice' | 'lineTotal' | 'gtn' | 'hsnSac' | 'taxRate'>> & {
    qty?: string | number | null;
    unitPrice?: string | number | null;
    lineTotal?: string | number | null;
    gtn?: string | null;
    hsnSac?: string | null;
    taxRate?: string | null;
    productCode?: string;
    productName?: string
  }>;
}): PrintableBarcodeLabel[] => {
  const labels: PrintableBarcodeLabel[] = [];

  for (const item of invoice.items ?? []) {
    const barcodeValue = String(item.gtn ?? item.productCode ?? '').trim();
    if (!barcodeValue) {
      continue;
    }

    const qty = Math.max(1, Math.round(Number(item.qty ?? 1)));
    const title = String(item.productName ?? item.productCode ?? 'Product');
    const subtitle = `Rs. ${Number(item.unitPrice ?? 0).toFixed(2)}`;

    for (let i = 0; i < qty; i += 1) {
      labels.push({ title, code: barcodeValue, subtitle });
    }
  }

  return labels;
};

stockInvoicesRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ error: 'Invalid stock invoice ID' });
    }

    const invoice = await db.select().from(stockInvoices).where(eq(stockInvoices.id, id)).get();
    if (!invoice) {
      return res.status(404).json({ error: 'Stock invoice not found' });
    }

    const items = await db
      .select({
        id: stockInvoiceItems.id,
        stockInvoiceId: stockInvoiceItems.stockInvoiceId,
        inventoryId: stockInvoiceItems.inventoryId,
        qty: stockInvoiceItems.qty,
        unitPrice: stockInvoiceItems.unitPrice,
        marginType: stockInvoiceItems.marginType,
        marginPct: stockInvoiceItems.marginPct,
        marginAmount: stockInvoiceItems.marginAmount,
        sellingPrice: stockInvoiceItems.sellingPrice,
        lineTotal: stockInvoiceItems.lineTotal,
        productId: inventories.productId,
        gtn: inventories.gtn,
        hsnSac: inventories.hsnSac,
        taxRate: inventories.taxRate,
        productCode: products.code,
        productName: products.name,
      })
      .from(stockInvoiceItems)
      .innerJoin(inventories, eq(inventories.id, stockInvoiceItems.inventoryId))
      .innerJoin(products, eq(products.id, inventories.productId))
      .where(eq(stockInvoiceItems.stockInvoiceId, id))
      .all();

    return res.json({ ...invoice, items });
  } catch (error) {
    console.error('Failed to fetch stock invoice', error);
    return res.status(500).json({ error: 'Failed to fetch stock invoice' });
  }
});

// return barcode labels (title, code, subtitle) for a stock invoice
stockInvoicesRouter.get('/:id/barcodes', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ error: 'Invalid stock invoice ID' });
    }

    const invoice = await db.select().from(stockInvoices).where(eq(stockInvoices.id, id)).get();
    if (!invoice) {
      return res.status(404).json({ error: 'Stock invoice not found' });
    }

    const items = await db
      .select({
        id: stockInvoiceItems.id,
        stockInvoiceId: stockInvoiceItems.stockInvoiceId,
        inventoryId: stockInvoiceItems.inventoryId,
        qty: stockInvoiceItems.qty,
        unitPrice: stockInvoiceItems.unitPrice,
        marginType: stockInvoiceItems.marginType,
        marginPct: stockInvoiceItems.marginPct,
        marginAmount: stockInvoiceItems.marginAmount,
        sellingPrice: stockInvoiceItems.sellingPrice,
        lineTotal: stockInvoiceItems.lineTotal,
        productId: inventories.productId,
        gtn: inventories.gtn,
        hsnSac: inventories.hsnSac,
        taxRate: inventories.taxRate,
        productCode: products.code,
        productName: products.name,
      })
      .from(stockInvoiceItems)
      .innerJoin(inventories, eq(inventories.id, stockInvoiceItems.inventoryId))
      .innerJoin(products, eq(products.id, inventories.productId))
      .where(eq(stockInvoiceItems.stockInvoiceId, id))
      .all();

    const labels = buildBarcodeLabels({ items });
    return res.json({ labels });
  } catch (error) {
    console.error('Failed to fetch barcode labels', error);
    return res.status(500).json({ error: 'Failed to fetch barcode labels' });
  }
});

// generate a PDF of barcode labels
stockInvoicesRouter.get('/:id/barcodes/pdf', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ error: 'Invalid stock invoice ID' });
    }

    const invoice = await db.select().from(stockInvoices).where(eq(stockInvoices.id, id)).get();
    if (!invoice) {
      return res.status(404).json({ error: 'Stock invoice not found' });
    }

    const items = await db
      .select({
        id: stockInvoiceItems.id,
        stockInvoiceId: stockInvoiceItems.stockInvoiceId,
        inventoryId: stockInvoiceItems.inventoryId,
        qty: stockInvoiceItems.qty,
        unitPrice: stockInvoiceItems.unitPrice,
        marginType: stockInvoiceItems.marginType,
        marginPct: stockInvoiceItems.marginPct,
        marginAmount: stockInvoiceItems.marginAmount,
        sellingPrice: stockInvoiceItems.sellingPrice,
        lineTotal: stockInvoiceItems.lineTotal,
        productId: inventories.productId,
        gtn: inventories.gtn,
        hsnSac: inventories.hsnSac,
        taxRate: inventories.taxRate,
        productCode: products.code,
        productName: products.name,
      })
      .from(stockInvoiceItems)
      .innerJoin(inventories, eq(inventories.id, stockInvoiceItems.inventoryId))
      .innerJoin(products, eq(products.id, inventories.productId))
      .where(eq(stockInvoiceItems.stockInvoiceId, id))
      .all();

    const labels = buildBarcodeLabels({ items });
    if (labels.length === 0) {
      return res.status(404).json({ error: 'No barcode data available for this invoice' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    doc.pipe(res);

    for (let i = 0; i < labels.length; i++) {
      const label = labels[i];
      doc.fontSize(12).font('Helvetica-Bold').text(label.title, { align: 'center' });
      // generate barcode image buffer
      try {
        const png: Buffer = await bwipjs.toBuffer({
          bcid: 'code128',
          text: label.code,
          scale: 3,
          includetext: false,
        });
        doc.image(png, { align: 'center', width: 200 });
      } catch (err) {
        console.error('barcode generation failed', err);
        // fall back to text
        doc.fontSize(10).text(label.code, { align: 'center' });
      }
      doc.fontSize(10).text(label.code, { align: 'center' });
      doc.fontSize(9).text(label.subtitle, { align: 'center' });
      if (i < labels.length - 1) {
        doc.addPage();
      }
    }

    doc.end();
  } catch (error) {
    console.error('Failed to generate barcode PDF', error);
    return res.status(500).json({ error: 'Failed to generate barcode PDF' });
  }
});

stockInvoicesRouter.post('/', async (req: Request, res: Response) => {
  try {
    const body = req.body as StockInvoiceInput;
    const items = body.items ?? [];

    if (items.length === 0) {
      return res.status(400).json({ error: 'At least one item is required' });
    }

    const created = await db.transaction(async (tx) => {
      const invoiceNumber = body.invoiceNumber || (await serialNumberService.generateInvoiceNumber('stockInvoice', tx));
      const insertedInvoice = await tx
        .insert(stockInvoices)
        .values({
          invoiceNumber,
          invoiceDate: normalizeDate(body.invoiceDate),
          totalQty: toNumericString(body.totalQty) ?? '0',
          totalAmount: toNumericString(body.totalAmount) ?? '0',
        })
        .returning()
        .get();

      const totals = await processInvoiceItems(tx, insertedInvoice.id, items);

      await tx
        .update(stockInvoices)
        .set({
          totalQty: toNumericString(body.totalQty) ?? toNumericString(totals.totalQty),
          totalAmount: toNumericString(body.totalAmount) ?? toNumericString(totals.totalAmount),
        })
        .where(eq(stockInvoices.id, insertedInvoice.id))
        .run();

      return tx.select().from(stockInvoices).where(eq(stockInvoices.id, insertedInvoice.id)).get();
    });

    return res.status(201).json(created);
  } catch (error) {
    console.error('Failed to create stock invoice', error);
    return res.status(400).json({ error: (error as Error).message || 'Failed to create stock invoice' });
  }
});

stockInvoicesRouter.put('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ error: 'Invalid stock invoice ID' });
    }

    const body = req.body as StockInvoiceInput;
    const items = body.items ?? [];
    if (items.length === 0) {
      return res.status(400).json({ error: 'At least one item is required' });
    }

    const updated = await db.transaction(async (tx) => {
      const existing = await tx.select().from(stockInvoices).where(eq(stockInvoices.id, id)).get();
      if (!existing) {
        throw new Error('Stock invoice not found');
      }

      const existingItems = await tx
        .select()
        .from(stockInvoiceItems)
        .where(eq(stockInvoiceItems.stockInvoiceId, id))
        .all();
      if (existingItems.length > 0) {
        const inventoryIds = [...new Set(existingItems.map((item) => item.inventoryId))];
        const inventoryRows = await tx.select().from(inventories).where(inArray(inventories.id, inventoryIds)).all();
        const inventoryMap = new Map(inventoryRows.map((row) => [row.id, row]));

        for (const item of existingItems) {
          const inventory = inventoryMap.get(item.inventoryId);
          if (!inventory) {
            continue;
          }

          const qty = Number(item.qty ?? 0);
          // Add inventory units back to stock
          const nextUnitsInStock = (inventory.unitsInStock ?? 0) - qty;
          await tx
            .update(inventories)
            .set({ unitsInStock: nextUnitsInStock })
            .where(eq(inventories.id, inventory.id))
            .run();
          inventoryMap.set(inventory.id, { ...inventory, unitsInStock: nextUnitsInStock });
        }

        await tx.delete(stockInvoiceItems).where(eq(stockInvoiceItems.stockInvoiceId, id)).run();
      }

      const totals = await processInvoiceItems(tx, id, items);

      await tx
        .update(stockInvoices)
        .set({
          invoiceNumber: body.invoiceNumber ?? existing.invoiceNumber,
          invoiceDate: body.invoiceDate ?? existing.invoiceDate,
          totalQty: toNumericString(body.totalQty) ?? toNumericString(totals.totalQty),
          totalAmount: toNumericString(body.totalAmount) ?? toNumericString(totals.totalAmount),
        })
        .where(eq(stockInvoices.id, id))
        .run();

      return tx.select().from(stockInvoices).where(eq(stockInvoices.id, id)).get();
    });

    return res.json(updated);
  } catch (error) {
    console.error('Failed to update stock invoice', error);
    return res.status(400).json({ error: (error as Error).message || 'Failed to update stock invoice' });
  }
});

stockInvoicesRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ error: 'Invalid stock invoice ID' });
    }

    await db.transaction(async (tx) => {
      const existing = await tx
        .select({ id: stockInvoices.id })
        .from(stockInvoices)
        .where(eq(stockInvoices.id, id))
        .get();
      if (!existing) {
        throw new Error('Stock invoice not found');
      }

      const items = await tx.select().from(stockInvoiceItems).where(eq(stockInvoiceItems.stockInvoiceId, id)).all();
      if (items.length > 0) {
        const inventoryIds = [...new Set(items.map((item) => item.inventoryId))];
        const inventoryRows = await tx.select().from(inventories).where(inArray(inventories.id, inventoryIds)).all();
        const inventoryMap = new Map(inventoryRows.map((row) => [row.id, row]));

        for (const item of items) {
          const inventory = inventoryMap.get(item.inventoryId);
          if (!inventory) {
            continue;
          }

          const qty = Number(item.qty ?? 0);
          // Revert stock qty update
          const nextUnitsInStock = (inventory.unitsInStock ?? 0) - qty;
          await tx
            .update(inventories)
            .set({ unitsInStock: nextUnitsInStock })
            .where(eq(inventories.id, inventory.id))
            .run();
          inventoryMap.set(inventory.id, { ...inventory, unitsInStock: nextUnitsInStock });
        }
      }

      await tx.delete(stockInvoiceItems).where(eq(stockInvoiceItems.stockInvoiceId, id)).run();
      await tx.delete(stockInvoices).where(eq(stockInvoices.id, id)).run();
    });

    return res.status(204).send();
  } catch (error) {
    console.error('Failed to delete stock invoice', error);
    return res.status(404).json({ error: (error as Error).message || 'Failed to delete stock invoice' });
  }
});
