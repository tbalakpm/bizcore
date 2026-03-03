import { eq } from 'drizzle-orm';
import express from 'express';

import { db, inventories } from '../db';

export const inventoriesRouter = express.Router();

inventoriesRouter.get('/', async (_req, res) => {
  const data = await db.select().from(inventories).orderBy(inventories.id).all();
  res.json({ data });
});

inventoriesRouter.get('/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: 'Invalid inventory ID' });
  }

  const inventory = await db.select().from(inventories).where(eq(inventories.id, id)).get();
  if (!inventory) {
    return res.status(404).json({ error: 'Inventory not found' });
  }

  return res.json(inventory);
});

inventoriesRouter.post('/', async (req, res) => {
  const { productId, gtn, qtyPerUnit, hsnSac, taxRate, buyingPrice, sellingPrice, unitsInStock, location } = req.body;
  if (!productId) {
    return res.status(400).json({ error: 'Product ID is required' });
  }

  const inventory = await db
    .insert(inventories)
    .values({
      productId,
      gtn,
      qtyPerUnit,
      hsnSac,
      taxRate: taxRate?.toString(),
      buyingPrice: buyingPrice?.toString(),
      sellingPrice: sellingPrice?.toString(),
      unitsInStock,
      location,
    })
    .returning()
    .get();

  return res.status(201).json(inventory);
});

inventoriesRouter.put('/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: 'Invalid inventory ID' });
  }

  const inventory = await db.select().from(inventories).where(eq(inventories.id, id)).get();
  if (!inventory) {
    return res.status(404).json({ error: 'Inventory not found' });
  }

  const { productId, gtn, qtyPerUnit, hsnSac, taxRate, buyingPrice, sellingPrice, unitsInStock, location } = req.body;
  await db
    .update(inventories)
    .set({
      productId: productId ?? inventory.productId,
      gtn: gtn ?? inventory.gtn,
      qtyPerUnit: qtyPerUnit ?? inventory.qtyPerUnit,
      hsnSac: hsnSac ?? inventory.hsnSac,
      taxRate: taxRate !== undefined ? taxRate?.toString() : inventory.taxRate,
      buyingPrice: buyingPrice !== undefined ? buyingPrice?.toString() : inventory.buyingPrice,
      sellingPrice: sellingPrice !== undefined ? sellingPrice?.toString() : inventory.sellingPrice,
      unitsInStock: unitsInStock ?? inventory.unitsInStock,
      location: location ?? inventory.location,
    })
    .where(eq(inventories.id, id))
    .run();

  const updated = await db.select().from(inventories).where(eq(inventories.id, id)).get();
  return res.json(updated);
});

inventoriesRouter.delete('/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: 'Invalid inventory ID' });
  }

  const inventory = await db.select({ id: inventories.id }).from(inventories).where(eq(inventories.id, id)).get();
  if (!inventory) {
    return res.status(404).json({ error: 'Inventory not found' });
  }

  await db.delete(inventories).where(eq(inventories.id, id)).run();
  return res.status(204).send();
});
