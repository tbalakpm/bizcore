import express, { type Request, type Response } from 'express';
import { asc, eq } from 'drizzle-orm';

import { db, products } from '../db';

export const productsRouter = express.Router();

productsRouter.get('/', async (_req: Request, res: Response) => {
  const result = await db.select().from(products).orderBy(asc(products.name));

  res.json(result);
});

productsRouter.get('/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const product = await db.select().from(products).where(eq(products.id, id)).get();
  if (!product) return res.status(404).json({ error: req.i18n?.t('product.notFound') });
  res.json(product);
});

productsRouter.post('/', async (req, res) => {
  const { code, name, description, categoryId, qtyPerUnit, unitPrice, unitsInStock, isActive } = req.body;

  if (!code) return res.status(400).json({ error: 'Code is required' });
  if (!name) return res.status(400).json({ error: 'Name is required' });
  if (!categoryId) return res.status(400).json({ error: 'Category ID is required' });

  try {
    const product = await db
      .insert(products)
      .values({
        code,
        name,
        description,
        categoryId,
        qtyPerUnit,
        unitPrice: unitPrice?.toString(),
        unitsInStock,
        isActive: isActive !== false,
      })
      .returning()
      .get();

    res.status(201).json(product);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: req.i18n?.t('product.exists') });
  }
});

productsRouter.put('/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { code, name, description, categoryId, qtyPerUnit, unitPrice, unitsInStock, isActive } = req.body;

  const product = await db.select().from(products).where(eq(products.id, id)).get();
  if (!product) return res.status(404).json({ error: req.i18n?.t('product.notFound') });

  if (code) product.code = code;
  if (name) product.name = name;
  if (description) product.description = description;
  if (categoryId) product.categoryId = categoryId;
  if (qtyPerUnit) product.qtyPerUnit = qtyPerUnit;
  if (unitPrice) product.unitPrice = unitPrice?.toString();
  if (unitsInStock !== undefined) product.unitsInStock = unitsInStock;
  if (typeof isActive === 'boolean') product.isActive = isActive;

  await db
    .update(products)
    .set({
      code: product.code,
      name: product.name,
      description: product.description,
      categoryId: product.categoryId,
      qtyPerUnit: product.qtyPerUnit,
      unitPrice: product.unitPrice,
      unitsInStock: product.unitsInStock,
      isActive: product.isActive,
    })
    .where(eq(products.id, id))
    .run();

  res.json(product);
});

productsRouter.delete('/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);

  const product = await db.select({ id: products.id }).from(products).where(eq(products.id, id)).get();
  if (!product) return res.status(404).json({ error: req.i18n?.t('product.notFound') });

  await db.delete(products).where(eq(products.id, id)).run();
  res.status(204).send();
});
