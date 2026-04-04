import { and, eq, inArray, like, sql, type SQL } from 'drizzle-orm';
import express, { type Request, type Response } from 'express';

import { db, inventories, products, stockInvoiceItems, stockInvoices } from '../db';
import type { StockInvoiceItemModel, StockInvoiceModel } from '../models/stock-invoice.model';
import { serialNumberService } from '../services/serial-number.service';
import { ProductSerialMode, productSerialNumberService } from '../services/product-serial-number.service';
import type { DbTransaction } from '../shared/serial-number.shared';
import { parsePagination, resolveSortDirection, toPagination } from '../utils/list-query.util';
import { normalizeDate } from '../utils/date.util';
import { toNumericString, toPositiveNumber, toNumber, toOptionalNumber } from '../utils/number.util';
import { generateGtn, shouldGenerateGtn } from '../utils/gtn.util';
import { LogService } from '../core/logger/logger.service';
import { auditLog } from '../core/logger/audit.service';

// barcode printing support
const PdfPrinter = require('pdfmake/js/printer').default;
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

      // Check if product is bundle and trackBundleGtn is disabled
      if (product.productType === 'bundle' && product.trackBundleGtn === false) {
        const { productBundles } = await import('../db');
        const bundles = await tx.select().from(productBundles).where(eq(productBundles.bundleProductId, product.id)).all();
        let baseTotal = 0;
        const comps = [];

        for (const b of bundles) {
          const cProduct = await tx.select().from(products).where(eq(products.id, b.productId)).get();
          if (cProduct) {
            const bVal = b.quantity * toPositiveNumber(cProduct.unitPrice, 1);
            baseTotal += bVal;
            comps.push({ b, cProduct, bVal });
          }
        }

        for (const c of comps) {
          const compQty = qty * c.b.quantity;
          const compUnitPrice = baseTotal > 0 ? (unitPrice * c.bVal / baseTotal) / c.b.quantity : 0;
          items.push({
            ...item,
            productId: c.cProduct.id,
            qty: compQty,
            unitPrice: compUnitPrice,
            lineTotal: Number((compQty * compUnitPrice).toFixed(2)),
            gtn: undefined, // ensure gtn is re-generated or blank for component
          });
        }
        
        // Skip adding the bundle itself since we've queued its components
        continue;
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
            taxRate: toNumber(item.taxRate) ?? product.taxRate,
            buyingPrice: toNumber(unitPrice) ?? product.unitPrice,
            sellingPrice: item.sellingPrice ? toNumber(item.sellingPrice) : product.unitPrice,
            unitsInStock: toNumber(qty),
            location: item.location,
            invoiceId: stockInvoiceId,
          })
          .returning({ id: inventories.id })
          .get();

        await tx
          .insert(stockInvoiceItems)
          .values({
            stockInvoiceId: stockInvoiceId as any,
            inventoryId: createdInventory.id as any,
            qty: toNumber(qty),
            unitPrice: toNumber(unitPrice),
            marginType: (item.marginType ?? 'none') as any,
            marginPct: toNumber(item.marginPct) ?? 0,
            marginAmount: toNumber(item.marginAmount) ?? 0,
            sellingPrice: toNumber(item.sellingPrice) ?? 0,
          })
          .run();
      } else {
        // Auto GTN Generation logic
        const gtnConfig = await productSerialNumberService.resolveGtnConfiguration(product.id, tx);
        const genType = gtnConfig.generation.toUpperCase();

        if (genType === 'TAG') {
          // TAG: Each quantity gets a distinct inventory row with qty 1
          for (let i = 0; i < qty; i++) {
            const generatedGtn = await productSerialNumberService.generateGtn(product.id, tx);
            const createdInventory = await tx
              .insert(inventories)
              .values({
                productId: product.id,
                gtn: generatedGtn,
                qtyPerUnit: product.qtyPerUnit,
                hsnSac: item.hsnSac ?? product.hsnSac,
                taxRate: toNumber(item.taxRate) ?? product.taxRate,
                buyingPrice: toNumber(unitPrice) ?? product.unitPrice,
                sellingPrice: item.sellingPrice ? toNumber(item.sellingPrice) : product.unitPrice,
                unitsInStock: 1,
                location: item.location,
                invoiceId: stockInvoiceId,
              })
              .returning({ id: inventories.id })
              .get();

            await tx
              .insert(stockInvoiceItems)
              .values({
                stockInvoiceId: stockInvoiceId as any,
                inventoryId: createdInventory.id as any,
                qty: 1,
                unitPrice: toNumber(unitPrice),
                marginType: (item.marginType ?? 'none') as any,
                marginPct: toNumber(item.marginPct) ?? 0,
                marginAmount: toNumber(item.marginAmount) ?? 0,
                sellingPrice: toNumber(item.sellingPrice) ?? 0,
              })
              .run();
          }
        } else {
          // CODE or BATCH or others: 1 row for the full quantity
          const generatedGtn = await productSerialNumberService.generateGtn(product.id, tx);

          const createdInventory = await tx
            .insert(inventories)
            .values({
              productId: product.id,
              gtn: generatedGtn,
              qtyPerUnit: product.qtyPerUnit,
              hsnSac: item.hsnSac ?? product.hsnSac,
              taxRate: toNumber(item.taxRate) ?? product.taxRate,
              buyingPrice: toNumber(unitPrice) ?? product.unitPrice,
              sellingPrice: item.sellingPrice ? toNumber(item.sellingPrice) : product.unitPrice,
              unitsInStock: toNumber(qty),
              location: item.location,
              invoiceId: stockInvoiceId,
            })
            .returning({ id: inventories.id })
            .get();

          await tx
            .insert(stockInvoiceItems)
            .values({
              stockInvoiceId: stockInvoiceId as any,
              inventoryId: createdInventory.id as any,
              qty: toNumber(qty),
              unitPrice: toNumber(unitPrice),
              marginType: (item.marginType ?? 'none') as any,
              marginPct: toNumber(item.marginPct) ?? 0,
              marginAmount: toNumber(item.marginAmount) ?? 0,
              sellingPrice: toNumber(item.sellingPrice) ?? 0,
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
        updatingPayload.sellingPrice = toNumber(item.sellingPrice);
      }

      await tx
        .update(inventories)
        .set(updatingPayload)
        .where(eq(inventories.id, inventory.id))
        .run();

      await tx
        .insert(stockInvoiceItems)
        .values({
          stockInvoiceId: stockInvoiceId as any,
          inventoryId: inventory.id as any,
          qty: toNumber(qty),
          unitPrice: toNumber(unitPrice),
          marginType: (item.marginType ?? 'none') as any,
          marginPct: toNumber(item.marginPct) ?? 0,
          marginAmount: toNumber(item.marginAmount) ?? 0,
          sellingPrice: toNumber(item.sellingPrice) ?? 0,
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

    LogService.info('Fetched stock invoices list', { count: data.length, total: filteredCount });
    res.json({
      data,
      pagination: toPagination(limit, offset, filteredCount, pageNum),
    });
  } catch (error) {
    LogService.error('Failed to fetch stock invoices', error);
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
    taxRate?: string | number | null;
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
    LogService.error('Failed to fetch stock invoice', error);
    return res.status(500).json({ error: 'Failed to fetch stock invoice' });
  }
});

// return barcode labels (title, code, subtitle) for a stock invoice
stockInvoicesRouter.get('/:id/barcodes', async (req: Request, res: Response) => {
  const id = parseInt(req.params.id as string, 10);
  try {
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

    const labels = buildBarcodeLabels({ items: items as any });
    LogService.info('Generated barcode labels (JSON)', { stockInvoiceId: id, labelCount: labels.length });
    return res.json({ labels });
  } catch (error) {
    LogService.error('Failed to fetch barcode labels', error, { stockInvoiceId: id });
    return res.status(500).json({ error: 'Failed to fetch barcode labels' });
  }
});

// generate a PDF of barcode labels
stockInvoicesRouter.get('/:id/barcodes/pdf', async (req: Request, res: Response) => {
  const id = parseInt(req.params.id as string, 10);
  try {
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

    const labels = buildBarcodeLabels({ items: items as any });
    if (labels.length === 0) {
      return res.status(404).json({ error: 'No barcode data available for this invoice' });
    }

    const fonts = {
      Helvetica: {
        normal: 'Helvetica',
        bold: 'Helvetica-Bold',
        italics: 'Helvetica-Oblique',
        bolditalics: 'Helvetica-BoldOblique'
      }
    };
    const URLResolver = require('pdfmake/js/URLResolver').default;
    const virtualfs = require('pdfmake/js/virtual-fs').default;
    const printer = new PdfPrinter(fonts, virtualfs, new URLResolver(virtualfs));
    const content: any[] = [];

    for (let i = 0; i < labels.length; i++) {
      const label = labels[i];
      const pageBreak = i < labels.length - 1 ? 'after' : undefined;

      content.push({
        text: label.title,
        fontSize: 12,
        bold: true,
        alignment: 'center',
        margin: [0, 0, 0, 10]
      });

      try {
        const png: Buffer = await bwipjs.toBuffer({
          bcid: 'code128',
          text: label.code,
          scale: 3,
          includetext: false,
        });
        const b64 = png.toString('base64');
        content.push({
          image: `data:image/png;base64,${b64}`,
          width: 200,
          alignment: 'center',
          margin: [0, 0, 0, 10]
        });
      } catch (err) {
        LogService.error('barcode generation failed', err);
        // fall back to text
        content.push({
          text: label.code,
          fontSize: 10,
          alignment: 'center',
          margin: [0, 0, 0, 10]
        });
      }

      content.push({
        text: label.code,
        fontSize: 10,
        alignment: 'center',
        margin: [0, 0, 0, 5]
      });

      content.push({
        text: label.subtitle,
        fontSize: 9,
        alignment: 'center',
        pageBreak: pageBreak
      });
    }

    const docDefinition = {
      content,
      pageSize: 'A4',
      pageMargins: [40, 40, 40, 40],
      defaultStyle: {
        font: 'Helvetica'
      }
    };

    res.setHeader('Content-Type', 'application/pdf');
    const pdfDoc = await printer.createPdfKitDocument(docDefinition);
    LogService.info('Generated barcode PDF', { stockInvoiceId: id, labelCount: labels.length });
    pdfDoc.pipe(res);
    pdfDoc.end();
  } catch (error) {
    LogService.error('Failed to generate barcode PDF', error, { stockInvoiceId: id });
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
          totalQty: toNumber(body.totalQty),
          totalAmount: toNumber(body.totalAmount),
        })
        .returning()
        .get();

      const totals = await processInvoiceItems(tx, insertedInvoice.id, items);

      await tx
        .update(stockInvoices)
        .set({
          totalQty: toNumber(body.totalQty) ?? totals.totalQty,
          totalAmount: toNumber(body.totalAmount) ?? totals.totalAmount,
        })
        .where(eq(stockInvoices.id, insertedInvoice.id))
        .run();

      return tx.select().from(stockInvoices).where(eq(stockInvoices.id, insertedInvoice.id)).get();
    });

    if (!created) {
      throw new Error('Failed to retrieve created invoice');
    }

    const itemsWithDetails = await db
      .select()
      .from(stockInvoiceItems)
      .where(eq(stockInvoiceItems.stockInvoiceId, created.id))
      .all();

    await auditLog({
      action: 'CREATE_STOCK_INVOICE',
      entity: 'STOCK_INVOICE',
      entityId: created.id,
      newValue: { ...created, items: itemsWithDetails },
    });

    LogService.info('Stock invoice created successfully', { stockInvoiceId: created.id, invoiceNumber: created.invoiceNumber });
    return res.status(201).json(created);
  } catch (error) {
    LogService.error('Failed to create stock invoice', error, { body: req.body });
    return res.status(400).json({ error: (error as Error).message || 'Failed to create stock invoice' });
  }
});

stockInvoicesRouter.put('/:id', async (req: Request, res: Response) => {
  const id = parseInt(req.params.id as string, 10);
  try {
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
        const inventoriesToDelete: number[] = [];
        const inventoryRows = await tx.select().from(inventories).where(inArray(inventories.id, inventoryIds)).all();
        const inventoryMap = new Map(inventoryRows.map((row) => [row.id, row]));

        for (const item of existingItems) {
          const inventory = inventoryMap.get(item.inventoryId);
          if (!inventory) {
            continue;
          }

          const qty = Number(item.qty ?? 0);
          const nextUnitsInStock = (inventory.unitsInStock ?? 0) - qty;
          
          if (nextUnitsInStock === 0 && inventory.invoiceId === id) {
            // Store for deletion after items are removed to avoid FK constraint error
            inventoriesToDelete.push(inventory.id);
          } else {
            await tx
              .update(inventories)
              .set({ unitsInStock: nextUnitsInStock })
              .where(eq(inventories.id, inventory.id))
              .run();
          }
          inventoryMap.set(inventory.id, { ...inventory, unitsInStock: nextUnitsInStock });
        }

        await tx.delete(stockInvoiceItems).where(eq(stockInvoiceItems.stockInvoiceId, id)).run();
        
        if (inventoriesToDelete.length > 0) {
          await tx.delete(inventories).where(inArray(inventories.id, inventoriesToDelete)).run();
          LogService.info('Deleted inventory records during PUT reversal (Stock)', { count: inventoriesToDelete.length, invoiceId: id });
        }
      }

      const totals = await processInvoiceItems(tx, id, items);

      await tx
        .update(stockInvoices)
        .set({
          invoiceNumber: body.invoiceNumber ?? existing.invoiceNumber,
          invoiceDate: body.invoiceDate ?? existing.invoiceDate,
          totalQty: toNumber(body.totalQty) ?? totals.totalQty,
          totalAmount: toNumber(body.totalAmount) ?? totals.totalAmount,
        })
        .where(eq(stockInvoices.id, id))
        .run();

      return tx.select().from(stockInvoices).where(eq(stockInvoices.id, id)).get();
    });

    if (!updated) {
      throw new Error('Failed to retrieve updated invoice');
    }

    // Capture states after transaction for audit log
    const oldInvoiceState = await db.select().from(stockInvoices).where(eq(stockInvoices.id, id)).get();
    const oldItemsState = await db.select().from(stockInvoiceItems).where(eq(stockInvoiceItems.stockInvoiceId, id)).all();

    const itemsWithDetails = await db
      .select()
      .from(stockInvoiceItems)
      .where(eq(stockInvoiceItems.stockInvoiceId, updated.id))
      .all();

    await auditLog({
      action: 'UPDATE_STOCK_INVOICE',
      entity: 'STOCK_INVOICE',
      entityId: id,
      oldValue: { ...oldInvoiceState, items: oldItemsState },
      newValue: { ...updated, items: itemsWithDetails },
    });

    LogService.info('Stock invoice updated successfully', { stockInvoiceId: id, invoiceNumber: updated.invoiceNumber });
    return res.json(updated);
  } catch (error) {
    LogService.error('Failed to update stock invoice', error, { stockInvoiceId: id });
    return res.status(400).json({ error: (error as Error).message || 'Failed to update stock invoice' });
  }
});

stockInvoicesRouter.delete('/:id', async (req: Request, res: Response) => {
  const id = parseInt(req.params.id as string, 10);
  try {
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
      const inventoriesToDelete: number[] = [];
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
          const nextUnitsInStock = (inventory.unitsInStock ?? 0) - qty;
          if (nextUnitsInStock === 0 && inventory.invoiceId === id) {
            inventoriesToDelete.push(inventory.id);
          } else {
            await tx
              .update(inventories)
              .set({ unitsInStock: nextUnitsInStock })
              .where(eq(inventories.id, inventory.id))
              .run();
          }
          inventoryMap.set(inventory.id, { ...inventory, unitsInStock: nextUnitsInStock });
        }
      }

      await tx.delete(stockInvoiceItems).where(eq(stockInvoiceItems.stockInvoiceId, id)).run();
      await tx.delete(stockInvoices).where(eq(stockInvoices.id, id)).run();

      if (inventoriesToDelete.length > 0) {
        await tx.delete(inventories).where(inArray(inventories.id, inventoriesToDelete)).run();
        LogService.info('Deleted inventory records after invoice deletion (Stock)', { count: inventoriesToDelete.length, invoiceId: id });
      }
    });

    LogService.info('Stock invoice deleted successfully', { stockInvoiceId: id });
    return res.status(204).send();
  } catch (error) {
    LogService.error('Failed to delete stock invoice', error, { stockInvoiceId: id });
    return res.status(404).json({ error: (error as Error).message || 'Failed to delete stock invoice' });
  }
});
