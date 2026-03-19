import { and, eq, like, sql, type SQL, getTableColumns } from 'drizzle-orm';
import express, { type Request, type Response } from 'express';

import { db, purchaseInvoices, purchaseInvoiceItems, suppliers, products, inventories } from '../db';
import { parsePagination, resolveSortDirection, toPagination } from '../utils/list-query.util';
import { toNumericString, toPositiveNumber } from '../utils/number.util';
import { generateGtn, shouldGenerateGtn } from '../utils/gtn.util';
import { ProductSerialMode, productSerialNumberService } from '../services/product-serial-number.service';
import { serialNumberService } from '../services/serial-number.service';
import type { DbTransaction } from '../shared/serial-number.shared';
import { renderPurchaseInvoice } from '../services/pdf/reports/purchase-invoice.report';

export const purchaseInvoicesRouter = express.Router();

purchaseInvoicesRouter.get('/', async (req: Request, res: Response) => {
  try {
    const hasPaginationQuery =
      req.query.limit !== undefined ||
      req.query.offset !== undefined ||
      req.query.page !== undefined ||
      req.query.pageNum !== undefined;

    const pagination = hasPaginationQuery
      ? parsePagination({
        limit: req.query.limit as string | undefined,
        offset: req.query.offset as string | undefined,
        page: req.query.page as string | undefined,
        pageNum: req.query.pageNum as string | undefined,
      })
      : undefined;

    // Build filters dynamically
    const filters: SQL[] = [];
    const filterableFields = ['invoiceNumber', 'refNumber'] as const;
    const sortableFields = ['id', 'invoiceNumber', 'invoiceDate', 'refNumber', 'subtotal', 'totalQty', 'netAmount'] as const;
    type SortableField = (typeof sortableFields)[number];
    const isSortableField = (value: string): value is SortableField =>
      (sortableFields as readonly string[]).includes(value);

    for (const field of filterableFields) {
      if (req.query[field]) {
        const column = purchaseInvoices[field];
        if (column) {
          filters.push(like(column, `%${req.query[field]}%`));
        }
      }
    }

    if (req.query.supplierId) {
      filters.push(eq(purchaseInvoices.supplierId, parseInt(req.query.supplierId as string, 10)));
    }

    // Build sort dynamically
    const orderBy: SQL[] = [];
    if (req.query.sort) {
      const sortParams = (req.query.sort as string).split(',');

      for (const param of sortParams) {
        const [field, direction] = param.split(':');
        const dir = resolveSortDirection(direction);

        if (!field || !isSortableField(field)) {
          continue;
        }

        const column = purchaseInvoices[field];
        if (column) {
          orderBy.push(dir(column));
        }
      }
    } else {
      orderBy.push(resolveSortDirection('desc')(purchaseInvoices.id));
    }

    // Build the query
    const baseQuery = db
      .select({
        ...getTableColumns(purchaseInvoices),
        supplierName: suppliers.name,
      })
      .from(purchaseInvoices)
      .leftJoin(suppliers, eq(purchaseInvoices.supplierId, suppliers.id));

    const query = filters.length > 0 ? baseQuery.where(and(...filters)) : baseQuery;

    // Get total count
    const whereCondition = filters.length > 0 ? and(...filters) : undefined;
    const filteredCountResult = await db
      .select({ count: sql<number>`cast(count(*) as integer)` })
      .from(purchaseInvoices)
      .where(whereCondition || sql`1=1`);

    const filteredCount = filteredCountResult[0].count;

    // Get paginated results
    const orderedQuery = query.orderBy(...orderBy);
    const result = pagination
      ? await orderedQuery.limit(pagination.limit).offset(pagination.offset).all()
      : await orderedQuery.all();

    res.json({
      data: result,
      pagination: pagination
        ? toPagination(pagination.limit, pagination.offset, filteredCount, pagination.pageNum)
        : {
          limit: result.length,
          offset: 0,
          total: filteredCount,
          page: 1,
          totalPages: 1,
        },
    });
  } catch (error) {
    console.error('Failed to fetch purchase invoices', error);
    res.status(500).json({ error: 'Failed to fetch purchase invoices' });
  }
});

purchaseInvoicesRouter.get('/:id', async (req: Request, res: Response) => {
  const id = parseInt(req.params.id as string, 10);
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: 'Invalid invoice ID' });
  }

  const invoice = await db
    .select({
      ...getTableColumns(purchaseInvoices),
      supplierName: suppliers.name,
    })
    .from(purchaseInvoices)
    .leftJoin(suppliers, eq(purchaseInvoices.supplierId, suppliers.id))
    .where(eq(purchaseInvoices.id, id))
    .get();

  if (!invoice) {
    return res.status(404).json({ error: 'Purchase invoice not found' });
  }

  const items = await db
    .select({
      ...getTableColumns(purchaseInvoiceItems),
      productName: products.name,
      productCode: products.code,
      productId: products.id,
      gtn: inventories.gtn,
    })
    .from(purchaseInvoiceItems)
    .leftJoin(inventories, eq(purchaseInvoiceItems.inventoryId, inventories.id))
    .leftJoin(products, eq(inventories.productId, products.id))
    .where(eq(purchaseInvoiceItems.purchaseInvoiceId, id))
    .all();

  res.json({ ...invoice, items });
});

const processPurchaseInvoiceItems = async (tx: DbTransaction, purchaseInvoiceId: number, items: any[]) => {
  let totalQty = 0;
  let subtotal = 0;

  for (const item of items) {
    const qty = toPositiveNumber(item.qty, 0);
    if (qty <= 0) continue;

    const unitPrice = toPositiveNumber(item.unitPrice, 0);
    let inventoryId = item.inventoryId;

    if (!inventoryId && item.productId) {
      const product = await tx.select().from(products).where(eq(products.id, item.productId)).get();
      if (!product) continue;

      if (item.gtn) {
        // Manual GTN
        let inv = await tx.select().from(inventories).where(
          and(eq(inventories.productId, product.id), eq(inventories.gtn, item.gtn))
        ).get();

        if (inv) {
          const updateData: any = { unitsInStock: (inv.unitsInStock || 0) + qty };
          if (item.sellingPrice !== undefined && item.sellingPrice !== null) {
              updateData.sellingPrice = toNumericString(item.sellingPrice);
          }
          await tx.update(inventories).set(updateData).where(eq(inventories.id, inv.id)).run();
          inventoryId = inv.id;
        } else {
          const newInv = await tx
            .insert(inventories)
            .values({
              productId: product.id,
              gtn: item.gtn,
              hsnSac: item.hsnSac || product.hsnSac,
              taxRate: toNumericString(item.taxPct) || product.taxRate,
              buyingPrice: toNumericString(unitPrice) || product.unitPrice,
              sellingPrice: item.sellingPrice ? toNumericString(item.sellingPrice) : undefined,
              unitsInStock: qty,
            })
            .returning({ id: inventories.id })
            .get();
          inventoryId = newInv.id;
        }
      } else {
        // Auto GTN
        const genType = (product.gtnGeneration || 'CODE').toUpperCase();
        if (genType === 'TAG') {
          for (let i = 0; i < qty; i++) {
            const generatedGtn = await productSerialNumberService.generateTagNumber(product.id, product.gtnMode as ProductSerialMode, tx);
            const inv = await tx
              .insert(inventories)
              .values({
                productId: product.id,
                gtn: generatedGtn,
                hsnSac: item.hsnSac || product.hsnSac,
                taxRate: toNumericString(item.taxPct) || product.taxRate,
                buyingPrice: toNumericString(unitPrice) || product.unitPrice,
                sellingPrice: item.sellingPrice ? toNumericString(item.sellingPrice) : undefined,
                unitsInStock: 1,
              })
              .returning({ id: inventories.id })
              .get();

            await tx.insert(purchaseInvoiceItems).values({
              purchaseInvoiceId,
              inventoryId: inv.id,
              qty: '1',
              unitPrice: toNumericString(unitPrice),
              discountType: item.discountType,
              discountPct: toNumericString(item.discountPct),
              discountAmount: toNumericString(item.discountAmount),
              taxPct: toNumericString(item.taxPct),
              marginType: item.marginType || 'none',
              marginPct: toNumericString(item.marginPct) || '0',
              marginAmount: toNumericString(item.marginAmount) || '0.00',
              sellingPrice: toNumericString(item.sellingPrice) || '0.00',
            }).run();
          }
          inventoryId = -1; // Marker that we handled insertion
        } else {
          let generatedGtn: string | undefined = undefined;
          if (genType === 'BATCH') {
            generatedGtn = await productSerialNumberService.generateBatchNumber(product.id, product.gtnMode as ProductSerialMode, tx);
          } else if (genType === 'CODE') {
            generatedGtn = product.code;
          } else if (shouldGenerateGtn(product.gtnGeneration)) {
            generatedGtn = generateGtn(product.code);
          }

          let inv;
          if (generatedGtn) {
            inv = await tx.select().from(inventories).where(
              and(eq(inventories.productId, product.id), eq(inventories.gtn, generatedGtn))
            ).get();
          }

          if (inv) {
            const updateData: any = { unitsInStock: (inv.unitsInStock || 0) + qty };
            if (item.sellingPrice !== undefined && item.sellingPrice !== null) {
                updateData.sellingPrice = toNumericString(item.sellingPrice);
            }
            await tx.update(inventories).set(updateData).where(eq(inventories.id, inv.id)).run();
            inventoryId = inv.id;
          } else {
            const newInv = await tx
              .insert(inventories)
              .values({
                productId: product.id,
                gtn: generatedGtn,
                hsnSac: item.hsnSac || product.hsnSac,
                taxRate: toNumericString(item.taxPct) || product.taxRate,
                buyingPrice: toNumericString(unitPrice) || product.unitPrice,
                sellingPrice: item.sellingPrice ? toNumericString(item.sellingPrice) : undefined,
                unitsInStock: qty,
              })
              .returning({ id: inventories.id })
              .get();
            inventoryId = newInv.id;
          }
        }
      }
    } else if (inventoryId) {
      const existing = await tx.select().from(inventories).where(eq(inventories.id, inventoryId)).get();
      if (existing) {
        const updateData: any = { unitsInStock: (existing.unitsInStock || 0) + qty };
        if (item.sellingPrice !== undefined && item.sellingPrice !== null) {
            updateData.sellingPrice = toNumericString(item.sellingPrice);
        }
        await tx.update(inventories)
          .set(updateData)
          .where(eq(inventories.id, inventoryId))
          .run();
      }
    }

    if (inventoryId && inventoryId !== -1) {
      await tx.insert(purchaseInvoiceItems).values({
        purchaseInvoiceId,
        inventoryId,
        qty: toNumericString(qty),
        unitPrice: toNumericString(unitPrice),
        discountType: item.discountType,
        discountPct: toNumericString(item.discountPct),
        discountAmount: toNumericString(item.discountAmount),
        taxPct: toNumericString(item.taxPct),
        marginType: item.marginType || 'none',
        marginPct: toNumericString(item.marginPct) || '0',
        marginAmount: toNumericString(item.marginAmount) || '0.00',
        sellingPrice: toNumericString(item.sellingPrice) || '0.00',
      }).run();
    }

    totalQty += qty;
    subtotal += (qty * unitPrice);
  }

  return { totalQty, subtotal };
};

purchaseInvoicesRouter.post('/', async (req, res) => {
  const body = req.body;
  const items = body.items ?? [];

  if (!body.invoiceDate || !body.supplierId || !items.length) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const result = await db.transaction(async (tx) => {
      // 1. Insert invoice header
      const invoiceNumber = body.invoiceNumber || (await serialNumberService.generateInvoiceNumber('purchaseInvoice', tx));
      const invoice = await tx
        .insert(purchaseInvoices)
        .values({
          invoiceNumber,
          invoiceDate: body.invoiceDate,
          supplierId: body.supplierId,
          refNumber: body.refNumber,
          refDate: body.refDate,
          subtotal: toNumericString(body.subtotal) ?? '0',
          totalQty: toNumericString(body.totalQty) ?? '0',
          discountType: body.discountType,
          discountPct: toNumericString(body.discountPct) ?? '0',
          discountAmount: toNumericString(body.discountAmount) ?? '0',
          taxPct: toNumericString(body.taxPct) ?? '0',
          roundOff: toNumericString(body.roundOff) ?? '0',
        })
        .returning()
        .get();

      // 2. Process items
      const totals = await processPurchaseInvoiceItems(tx, invoice.id, items);

      // 3. Update header if totals were not provided or need sync
      await tx
        .update(purchaseInvoices)
        .set({
          totalQty: toNumericString(body.totalQty) ?? toNumericString(totals.totalQty),
          subtotal: toNumericString(body.subtotal) ?? toNumericString(totals.subtotal),
        })
        .where(eq(purchaseInvoices.id, invoice.id))
        .run();

      return tx.select().from(purchaseInvoices).where(eq(purchaseInvoices.id, invoice.id)).get();
    });

    res.status(201).json(result);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: (err as Error).message || 'Failed to create purchase invoice' });
  }
});

purchaseInvoicesRouter.put('/:id', async (req, res) => {
  const id = parseInt(req.params.id as string, 10);
  const body = req.body;
  const items = body.items ?? [];

  try {
    await db.transaction(async (tx) => {
      const existing = await tx.select().from(purchaseInvoices).where(eq(purchaseInvoices.id, id)).get();
      if (!existing) throw new Error('Invoice not found');

      // 1. Reverse stock
      const oldItems = await tx.select().from(purchaseInvoiceItems).where(eq(purchaseInvoiceItems.purchaseInvoiceId, id)).all();
      for (const oldItem of oldItems) {
        const inv = await tx.select().from(inventories).where(eq(inventories.id, oldItem.inventoryId)).get();
        if (inv) {
          await tx.update(inventories)
            .set({ unitsInStock: (inv.unitsInStock || 0) - Number(oldItem.qty || 0) })
            .where(eq(inventories.id, inv.id))
            .run();
        }
      }

      await tx.delete(purchaseInvoiceItems).where(eq(purchaseInvoiceItems.purchaseInvoiceId, id)).run();

      // 2. Update header
      await tx
        .update(purchaseInvoices)
        .set({
          invoiceNumber: body.invoiceNumber ?? existing.invoiceNumber,
          invoiceDate: body.invoiceDate ?? existing.invoiceDate,
          supplierId: body.supplierId ?? existing.supplierId,
          refNumber: body.refNumber ?? existing.refNumber,
          refDate: body.refDate ?? existing.refDate,
          subtotal: toNumericString(body.subtotal) ?? existing.subtotal,
          totalQty: toNumericString(body.totalQty) ?? existing.totalQty,
          discountType: body.discountType ?? existing.discountType,
          discountPct: toNumericString(body.discountPct) ?? existing.discountPct,
          discountAmount: toNumericString(body.discountAmount) ?? existing.discountAmount,
          taxPct: toNumericString(body.taxPct) ?? existing.taxPct,
          roundOff: toNumericString(body.roundOff) ?? existing.roundOff,
        })
        .where(eq(purchaseInvoices.id, id))
        .run();

      // 3. Process new items
      const totals = await processPurchaseInvoiceItems(tx, id, items);

      // 4. Update header with recalculated totals if needed
      await tx
        .update(purchaseInvoices)
        .set({
          totalQty: toNumericString(body.totalQty) ?? toNumericString(totals.totalQty),
          subtotal: toNumericString(body.subtotal) ?? toNumericString(totals.subtotal),
        })
        .where(eq(purchaseInvoices.id, id))
        .run();
    });

    res.json({ message: 'Success' });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: (err as Error).message || 'Failed to update' });
  }
});

purchaseInvoicesRouter.delete('/:id', async (req: Request, res: Response) => {
  const id = parseInt(req.params.id as string, 10);

  try {
    await db.transaction(async (tx) => {
      // Reverse stock
      const items = await tx.select().from(purchaseInvoiceItems).where(eq(purchaseInvoiceItems.purchaseInvoiceId, id)).all();
      for (const item of items) {
        const inv = await tx.select().from(inventories).where(eq(inventories.id, item.inventoryId)).get();
        if (inv) {
          await tx.update(inventories)
            .set({ unitsInStock: (inv.unitsInStock || 0) - Number(item.qty || 0) })
            .where(eq(inventories.id, inv.id))
            .run();
        }
      }
      await tx.delete(purchaseInvoiceItems).where(eq(purchaseInvoiceItems.purchaseInvoiceId, id)).run();
      await tx.delete(purchaseInvoices).where(eq(purchaseInvoices.id, id)).run();
    });
    res.status(204).send();
  } catch (err) {
    res.status(400).json({ error: 'Failed' });
  }
});

// PDF Generation Route 
purchaseInvoicesRouter.get('/:id/pdf', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ error: 'Invalid purchase invoice ID' });
    }

    await renderPurchaseInvoice(id, db, res);
  } catch (error) {
    console.error('Failed to generate purchase invoice PDF', error);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
});
