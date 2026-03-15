import { and, eq, like, sql, type SQL, getTableColumns } from 'drizzle-orm';
import { alias } from 'drizzle-orm/sqlite-core';
import express, { type Request, type Response } from 'express';

import { suppliers, db, addresses } from '../db';
import { parsePagination, resolveSortDirection, toPagination } from '../utils/list-query.util';

export const suppliersRouter = express.Router();

const billingAddress = alias(addresses, 'billing_address');
const shippingAddress = alias(addresses, 'shipping_address');

suppliersRouter.get('/', async (req: Request, res: Response) => {
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
    const filterableFields = ['code', 'name', 'notes', 'gstin'] as const;
    const sortableFields = ['id', ...filterableFields, 'isActive', 'createdAt', 'updatedAt'] as const;
    type SortableField = (typeof sortableFields)[number];
    const isSortableField = (value: string): value is SortableField =>
      (sortableFields as readonly string[]).includes(value);

    for (const field of filterableFields) {
      if (req.query[field]) {
        const column = suppliers[field];
        if (column) {
          filters.push(like(column, `%${req.query[field]}%`));
        }
      }
    }

    // Filter by active status
    if (req.query.isActive !== undefined) {
      const isActive = req.query.isActive === 'true';
      filters.push(eq(suppliers.isActive, isActive));
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

        const column = suppliers[field];
        if (column) {
          orderBy.push(dir(column));
        }
      }
    } else {
      orderBy.push(resolveSortDirection('desc')(suppliers.id));
    }

    // Build the query with joins
    const baseQuery = db
      .select({
        ...getTableColumns(suppliers),
        billingAddress: billingAddress,
        shippingAddress: shippingAddress,
      })
      .from(suppliers)
      .leftJoin(billingAddress, eq(suppliers.billingAddressId, billingAddress.id))
      .leftJoin(shippingAddress, eq(suppliers.shippingAddressId, shippingAddress.id));

    const query = filters.length > 0 ? baseQuery.where(and(...filters)) : baseQuery;

    // Get total count
    const whereCondition = filters.length > 0 ? and(...filters) : undefined;
    const filteredCountResult = await db
      .select({ count: sql<number>`cast(count(*) as integer)` })
      .from(suppliers)
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
    console.error('Failed to fetch suppliers', error);
    res.status(500).json({ error: 'Failed to fetch suppliers' });
  }
});

suppliersRouter.get('/:id', async (req: Request, res: Response) => {
  const id = parseInt(req.params.id as string, 10);
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: 'Invalid supplier ID' });
  }

  const supplier = await db
    .select({
      ...getTableColumns(suppliers),
      billingAddress: billingAddress,
      shippingAddress: shippingAddress,
    })
    .from(suppliers)
    .leftJoin(billingAddress, eq(suppliers.billingAddressId, billingAddress.id))
    .leftJoin(shippingAddress, eq(suppliers.shippingAddressId, shippingAddress.id))
    .where(eq(suppliers.id, id))
    .get();

  if (!supplier) {
    return res.status(404).json({
      error: req.i18n?.t('supplier.notFound') || 'Supplier not found',
    });
  }

  res.json(supplier);
});

suppliersRouter.post('/', async (req, res) => {
  const { code, name, notes, isActive, gstin, billingAddress: bAddr, shippingAddress: sAddr } = req.body;

  if (!name) return res.status(400).json({ error: 'Name is required' });
  if (!code) return res.status(400).json({ error: 'Code is required' });

  try {
    const result = await db.transaction(async (tx) => {
      let billingAddressId: number | undefined;
      let shippingAddressId: number | undefined;

      if (bAddr && Object.keys(bAddr).length > 0) {
        const addr = await tx.insert(addresses).values(bAddr).returning({ id: addresses.id }).get();
        billingAddressId = addr.id;
      }

      if (sAddr && Object.keys(sAddr).length > 0) {
        const addr = await tx.insert(addresses).values(sAddr).returning({ id: addresses.id }).get();
        shippingAddressId = addr.id;
      }

      return await tx
        .insert(suppliers)
        .values({
          code,
          name,
          gstin,
          billingAddressId,
          shippingAddressId,
          notes,
          isActive: isActive !== false,
        })
        .returning()
        .get();
    });

    res.status(201).json(result);
  } catch (err) {
    console.error(err);
    res.status(400).json({
      error: req.i18n?.t('supplier.exists') || 'Supplier already exists or invalid data',
    });
  }
});

suppliersRouter.put('/:id', async (req, res) => {
  const id = parseInt(req.params.id as string, 10);

  const existingSupplier = await db.select().from(suppliers).where(eq(suppliers.id, id)).get();
  if (!existingSupplier)
    return res.status(404).json({
      error: req.i18n?.t('supplier.notFound') || 'Supplier not found',
    });

  const { code, name, notes, isActive, gstin, billingAddress: bAddr, shippingAddress: sAddr } = req.body;

  try {
    const updatedSupplier = await db.transaction(async (tx) => {
      let bAddrId = existingSupplier.billingAddressId;
      let sAddrId = existingSupplier.shippingAddressId;

      if (bAddr) {
        if (bAddrId) {
          await tx.update(addresses).set(bAddr).where(eq(addresses.id, bAddrId)).run();
        } else if (Object.keys(bAddr).length > 0) {
          const addr = await tx.insert(addresses).values(bAddr).returning({ id: addresses.id }).get();
          bAddrId = addr.id;
        }
      }

      if (sAddr) {
        if (sAddrId) {
          await tx.update(addresses).set(sAddr).where(eq(addresses.id, sAddrId)).run();
        } else if (Object.keys(sAddr).length > 0) {
          const addr = await tx.insert(addresses).values(sAddr).returning({ id: addresses.id }).get();
          sAddrId = addr.id;
        }
      }

      await tx
        .update(suppliers)
        .set({
          code: code ?? existingSupplier.code,
          name: name ?? existingSupplier.name,
          gstin: gstin ?? existingSupplier.gstin,
          billingAddressId: bAddrId,
          shippingAddressId: sAddrId,
          notes: notes ?? existingSupplier.notes,
          isActive: typeof isActive === 'boolean' ? isActive : existingSupplier.isActive,
        })
        .where(eq(suppliers.id, id))
        .run();

      return { ...existingSupplier, code, name, gstin, notes, isActive, billingAddressId: bAddrId, shippingAddressId: sAddrId };
    });

    res.json(updatedSupplier);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: 'Failed to update supplier' });
  }
});

suppliersRouter.delete('/:id', async (req, res) => {
  const id = parseInt(req.params.id as string, 10);

  const supplier = await db.select({ id: suppliers.id }).from(suppliers).where(eq(suppliers.id, id)).get();
  if (!supplier)
    return res.status(404).json({
      error: req.i18n?.t('supplier.notFound') || 'Supplier not found',
    });

  await db.delete(suppliers).where(eq(suppliers.id, id)).run();
  res.status(204).send();
});
