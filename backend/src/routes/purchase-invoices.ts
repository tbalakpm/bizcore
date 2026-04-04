import { and, eq, inArray, like, sql, type SQL, getTableColumns } from 'drizzle-orm';
import express, { type Request, type Response } from 'express';

import { db, purchaseInvoices, purchaseInvoiceItems, suppliers, products, inventories } from '../db';
import { parsePagination, resolveSortDirection, toPagination } from '../utils/list-query.util';
import { toNumericString, toPositiveNumber, toNumber } from '../utils/number.util';

import { productSerialNumberService } from '../services/product-serial-number.service';
import { serialNumberService } from '../services/serial-number.service';
import type { DbTransaction } from '../shared/serial-number.shared';
import { renderPurchaseInvoice } from '../services/pdf/reports/purchase-invoice.report';
import { LogService } from '../core/logger/logger.service';
import { auditLog } from '../core/logger/audit.service';

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
    const sortableFields = ['id', 'invoiceNumber', 'invoiceDate', 'refNumber', 'subtotal', 'totalQty', 'netAmount', 'supplierName'] as const;
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

    if (req.query.minAmount) {
      filters.push(sql`${purchaseInvoices.netAmount} >= ${toNumber(req.query.minAmount)}`);
    }

    if (req.query.maxAmount) {
      filters.push(sql`${purchaseInvoices.netAmount} <= ${toNumber(req.query.maxAmount)}`);
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

        if (field === 'supplierName') {
          orderBy.push(dir(suppliers.name));
        } else {
          const column = purchaseInvoices[field as keyof typeof purchaseInvoices];
          if (column) {
            orderBy.push(dir(column as any));
          }
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

    LogService.info('Fetched purchase invoices list', { count: result.length, total: filteredCount });
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
    LogService.error('Failed to fetch purchase invoices', error);
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
    LogService.warn('Purchase invoice not found', { purchaseInvoiceId: id });
    return res.status(404).json({ error: 'Purchase invoice not found' });
  }

  LogService.info('Fetched purchase invoice details', { purchaseInvoiceId: id, invoiceNumber: invoice.invoiceNumber });
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
  let totalTaxAmount = 0;

  for (const item of items) {
    const qty = toPositiveNumber(item.qty, 0);
    if (qty <= 0) continue;

    const unitPrice = toPositiveNumber(item.unitPrice, 0);
    let inventoryId = item.inventoryId;

    if (!inventoryId && item.productId) {
      const product = await tx.select().from(products).where(eq(products.id, item.productId)).get();
      if (!product) continue;

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
            inventoryId: undefined,
          });
        }

        continue;
      }

      if (item.gtn) {
        // Manual GTN
        let inv = await tx.select().from(inventories).where(
          and(eq(inventories.productId, product.id), eq(inventories.gtn, item.gtn))
        ).get();

        if (inv) {
          const updateData: any = { unitsInStock: (inv.unitsInStock || 0) + qty };
          if (item.sellingPrice !== undefined && item.sellingPrice !== null) {
            updateData.sellingPrice = toNumber(item.sellingPrice);
          }
          await tx.update(inventories).set(updateData).where(eq(inventories.id, inv.id)).run();
          inventoryId = inv.id;
        } else {
          const newInv = await tx
            .insert(inventories)
            .values({
              productId: product.id,
              gtn: item.gtn,
              qtyPerUnit: product.qtyPerUnit,
              hsnSac: item.hsnSac || product.hsnSac,
              taxRate: toNumber(item.taxPct) || product.taxRate,
              buyingPrice: toNumber(unitPrice) || product.unitPrice,
              sellingPrice: item.sellingPrice ? toNumber(item.sellingPrice) : undefined,
              unitsInStock: toNumber(qty),
              invoiceId: purchaseInvoiceId,
            })
            .returning({ id: inventories.id })
            .get();
          inventoryId = newInv.id;
        }
      } else {
        // Auto GTN
        const gtnConfig = await productSerialNumberService.resolveGtnConfiguration(product.id, tx);
        const genType = gtnConfig.generation.toUpperCase();
        if (genType === 'TAG') {
          for (let i = 0; i < qty; i++) {
            const generatedGtn = await productSerialNumberService.generateGtn(product.id, tx);
            const inv = await tx
              .insert(inventories)
              .values({
                productId: product.id,
                gtn: generatedGtn,
                qtyPerUnit: product.qtyPerUnit,
                hsnSac: item.hsnSac || product.hsnSac,
                taxRate: toNumber(item.taxPct) || product.taxRate,
                buyingPrice: toNumber(unitPrice) || product.unitPrice,
                sellingPrice: item.sellingPrice ? toNumber(item.sellingPrice) : undefined,
                unitsInStock: 1,
                invoiceId: purchaseInvoiceId,
              })
              .returning({ id: inventories.id })
              .get();

            await tx.insert(purchaseInvoiceItems).values({
              purchaseInvoiceId,
              inventoryId: inv.id,
              qty: 1,
              unitPrice: toNumber(unitPrice),
              discountType: item.discountType,
              discountPct: toNumber(item.discountPct),
              discountAmount: toNumber(item.discountAmount),
              taxPct: toNumber(item.taxPct),
              sgstAmount: toNumber(item.sgstAmount) || 0,
              cgstAmount: toNumber(item.cgstAmount) || 0,
              igstAmount: toNumber(item.igstAmount) || 0,
              marginType: item.marginType || 'none',
              marginPct: toNumber(item.marginPct) || 0,
              marginAmount: toNumber(item.marginAmount) || 0,
              sellingPrice: toNumber(item.sellingPrice) || 0,
            }).run();

            totalTaxAmount += (toNumber(item.taxAmount) || (toNumber(item.sgstAmount || 0) + toNumber(item.cgstAmount || 0) + toNumber(item.igstAmount || 0)));
          }
          inventoryId = -1; // Marker that we handled insertion
        } else {
          const generatedGtn = await productSerialNumberService.generateGtn(product.id, tx);

          let inv;
          if (generatedGtn) {
            inv = await tx.select().from(inventories).where(
              and(eq(inventories.productId, product.id), eq(inventories.gtn, generatedGtn))
            ).get();
          }

          if (inv) {
            const updateData: any = { unitsInStock: (inv.unitsInStock || 0) + qty };
            if (item.sellingPrice !== undefined && item.sellingPrice !== null) {
              updateData.sellingPrice = toNumber(item.sellingPrice);
            }
            await tx.update(inventories).set(updateData).where(eq(inventories.id, inv.id)).run();
            inventoryId = inv.id;
          } else {
            const newInv = await tx
              .insert(inventories)
              .values({
                productId: product.id,
                gtn: generatedGtn,
                qtyPerUnit: product.qtyPerUnit,
                hsnSac: item.hsnSac || product.hsnSac,
                taxRate: toNumber(item.taxPct) || product.taxRate,
                buyingPrice: toNumber(unitPrice) || product.unitPrice,
                sellingPrice: item.sellingPrice ? toNumber(item.sellingPrice) : undefined,
                unitsInStock: toNumber(qty),
                invoiceId: purchaseInvoiceId,
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
        qty: toNumber(qty),
        unitPrice: toNumber(unitPrice),
        discountType: item.discountType,
        discountPct: toNumber(item.discountPct),
        discountAmount: toNumber(item.discountAmount),
        taxPct: toNumber(item.taxPct),
        sgstAmount: toNumber(item.sgstAmount) || 0,
        cgstAmount: toNumber(item.cgstAmount) || 0,
        igstAmount: toNumber(item.igstAmount) || 0,
        marginType: item.marginType || 'none',
        marginPct: toNumber(item.marginPct) || 0,
        marginAmount: toNumber(item.marginAmount) || 0,
        sellingPrice: toNumber(item.sellingPrice) || 0,
      }).run();
      totalTaxAmount += (toNumber(item.taxAmount) || (toNumber(item.sgstAmount || 0) + toNumber(item.cgstAmount || 0) + toNumber(item.igstAmount || 0)));
    }

    totalQty += qty;
    subtotal += (qty * unitPrice);
  }

  return { totalQty, subtotal, totalTaxAmount };
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
          subtotal: toNumber(body.subtotal),
          totalQty: toNumber(body.totalQty),
          discountType: body.discountType,
          discountPct: toNumber(body.discountPct),
          discountAmount: toNumber(body.discountAmount),
          totalTaxAmount: toNumber(body.taxAmount),
          roundOff: toNumber(body.roundOff),
        })
        .returning()
        .get();

      // 2. Process items
      const totals = await processPurchaseInvoiceItems(tx, invoice.id, items);

      // 3. Update header if totals were not provided or need sync
      await tx
        .update(purchaseInvoices)
        .set({
          totalQty: toNumber(body.totalQty) ?? toNumber(totals.totalQty),
          subtotal: toNumber(body.subtotal) ?? toNumber(totals.subtotal),
          totalTaxAmount: toNumber(body.taxAmount) ?? toNumber(totals.totalTaxAmount),
        })
        .where(eq(purchaseInvoices.id, invoice.id))
        .run();

      return tx.select().from(purchaseInvoices).where(eq(purchaseInvoices.id, invoice.id)).get();
    });

    if (!result) {
      throw new Error('Failed to retrieve created purchase invoice');
    }

    const itemsWithDetails = await db
      .select()
      .from(purchaseInvoiceItems)
      .where(eq(purchaseInvoiceItems.purchaseInvoiceId, result.id))
      .all();

    await auditLog({
      action: 'CREATE_PURCHASE_INVOICE',
      entity: 'PURCHASE_INVOICE',
      entityId: result.id,
      newValue: { ...result, items: itemsWithDetails },
    });

    LogService.info('Purchase invoice created successfully', { purchaseInvoiceId: result.id, invoiceNumber: result.invoiceNumber });
    res.status(201).json(result);
  } catch (err) {
    LogService.error('Failed to create purchase invoice', err, { body: req.body });
    res.status(400).json({ error: (err as Error).message || 'Failed to create purchase invoice' });
  }
});

purchaseInvoicesRouter.put('/:id', async (req, res) => {
  const id = parseInt(req.params.id as string, 10);
  const body = req.body;
  const items = body.items ?? [];

  try {
    const oldInvoice = await db.select().from(purchaseInvoices).where(eq(purchaseInvoices.id, id)).get();
    if (!oldInvoice) {
      LogService.warn('Purchase invoice not found for update', { purchaseInvoiceId: id });
      return res.status(404).json({ error: 'Invoice not found' });
    }
    const oldItems = await db.select().from(purchaseInvoiceItems).where(eq(purchaseInvoiceItems.purchaseInvoiceId, id)).all();

    await db.transaction(async (tx) => {
      // 1. Reverse stock
      const inventoriesToDelete: number[] = [];
      for (const oldItem of oldItems) {
        const inv = await tx.select().from(inventories).where(eq(inventories.id, oldItem.inventoryId)).get();
        if (inv) {
          const nextQty = (inv.unitsInStock || 0) - Number(oldItem.qty || 0);
          if (nextQty === 0 && inv.invoiceId === id) {
            inventoriesToDelete.push(inv.id);
          } else {
            await tx.update(inventories)
              .set({ unitsInStock: nextQty })
              .where(eq(inventories.id, inv.id))
              .run();
          }
        }
      }

      await tx.delete(purchaseInvoiceItems).where(eq(purchaseInvoiceItems.purchaseInvoiceId, id)).run();

      if (inventoriesToDelete.length > 0) {
        await tx.delete(inventories).where(inArray(inventories.id, inventoriesToDelete)).run();
        LogService.info('Deleted inventory records during PUT reversal (Purchase)', { count: inventoriesToDelete.length, invoiceId: id });
      }

      // 2. Update header
      await tx
        .update(purchaseInvoices)
        .set({
          invoiceNumber: body.invoiceNumber ?? oldInvoice.invoiceNumber,
          invoiceDate: body.invoiceDate ?? oldInvoice.invoiceDate,
          supplierId: body.supplierId ?? oldInvoice.supplierId,
          refNumber: body.refNumber ?? oldInvoice.refNumber,
          refDate: body.refDate ?? oldInvoice.refDate,
          subtotal: toNumber(body.subtotal) ?? oldInvoice.subtotal,
          totalQty: toNumber(body.totalQty) ?? oldInvoice.totalQty,
          discountType: body.discountType ?? oldInvoice.discountType,
          discountPct: toNumber(body.discountPct) ?? oldInvoice.discountPct,
          discountAmount: toNumber(body.discountAmount) ?? oldInvoice.discountAmount,
          totalTaxAmount: toNumber(body.taxAmount) ?? oldInvoice.totalTaxAmount,
          roundOff: toNumber(body.roundOff) ?? oldInvoice.roundOff,
        })
        .where(eq(purchaseInvoices.id, id))
        .run();

      // 3. Process new items
      const totals = await processPurchaseInvoiceItems(tx, id, items);

      // 4. Update header with recalculated totals if needed
      await tx
        .update(purchaseInvoices)
        .set({
          totalQty: toNumber(body.totalQty) || totals.totalQty,
          subtotal: toNumber(body.subtotal) || totals.subtotal,
          totalTaxAmount: toNumber(body.taxAmount) || totals.totalTaxAmount,
        })
        .where(eq(purchaseInvoices.id, id))
        .run();
    });

    const updatedInvoice = await db.select().from(purchaseInvoices).where(eq(purchaseInvoices.id, id)).get();
    const updatedItems = await db.select().from(purchaseInvoiceItems).where(eq(purchaseInvoiceItems.purchaseInvoiceId, id)).all();

    if (updatedInvoice) {
      await auditLog({
        action: 'UPDATE_PURCHASE_INVOICE',
        entity: 'PURCHASE_INVOICE',
        entityId: id,
        oldValue: { ...oldInvoice, items: oldItems },
        newValue: { ...updatedInvoice, items: updatedItems },
      });
      LogService.info('Purchase invoice updated successfully', { purchaseInvoiceId: id, invoiceNumber: updatedInvoice.invoiceNumber });
    }
    res.json(updatedInvoice);
  } catch (err) {
    LogService.error('Failed to update purchase invoice', err, { purchaseInvoiceId: id });
    res.status(400).json({ error: (err as Error).message || 'Failed to update' });
  }
});

purchaseInvoicesRouter.delete('/:id', async (req: Request, res: Response) => {
  const id = parseInt(req.params.id as string, 10);

  try {
    const oldInvoice = await db.select().from(purchaseInvoices).where(eq(purchaseInvoices.id, id)).get();
    if (!oldInvoice) {
      LogService.warn('Purchase invoice not found for deletion', { purchaseInvoiceId: id });
      return res.status(404).json({ error: 'Invoice not found' });
    }
    const oldItems = await db.select().from(purchaseInvoiceItems).where(eq(purchaseInvoiceItems.purchaseInvoiceId, id)).all();

    await db.transaction(async (tx) => {
      // Reverse stock
      const inventoriesToDelete: number[] = [];
      for (const item of oldItems) {
        const inv = await tx.select().from(inventories).where(eq(inventories.id, item.inventoryId)).get();
        if (inv) {
          const nextQty = (inv.unitsInStock || 0) - Number(item.qty || 0);
          if (nextQty === 0 && inv.invoiceId === id) {
            inventoriesToDelete.push(inv.id);
          } else {
            await tx.update(inventories)
              .set({ unitsInStock: nextQty })
              .where(eq(inventories.id, inv.id))
              .run();
          }
        }
      }
      await tx.delete(purchaseInvoiceItems).where(eq(purchaseInvoiceItems.purchaseInvoiceId, id)).run();
      await tx.delete(purchaseInvoices).where(eq(purchaseInvoices.id, id)).run();

      if (inventoriesToDelete.length > 0) {
        await tx.delete(inventories).where(inArray(inventories.id, inventoriesToDelete)).run();
        LogService.info('Deleted inventory records after invoice deletion (Purchase)', { count: inventoriesToDelete.length, invoiceId: id });
      }
    });

    await auditLog({
      action: 'DELETE_PURCHASE_INVOICE',
      entity: 'PURCHASE_INVOICE',
      entityId: id,
      oldValue: { ...oldInvoice, items: oldItems },
    });

    LogService.info('Purchase invoice deleted successfully', { purchaseInvoiceId: id, invoiceNumber: oldInvoice.invoiceNumber });
    res.status(204).send();
  } catch (error) {
    LogService.error('Failed to delete purchase invoice', error, { purchaseInvoiceId: id });
    res.status(400).json({ error: 'Failed to delete purchase invoice' });
  }
});

// PDF Generation Route 
purchaseInvoicesRouter.get('/:id/pdf', async (req: Request, res: Response) => {
  const id = parseInt(req.params.id as string, 10);
  try {
    if (Number.isNaN(id)) {
      return res.status(400).json({ error: 'Invalid purchase invoice ID' });
    }

    await renderPurchaseInvoice(id, db, res);
    LogService.info('Generated purchase invoice PDF', { purchaseInvoiceId: id });
  } catch (error) {
    LogService.error('Failed to generate purchase invoice PDF', error, { purchaseInvoiceId: id });
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
});
