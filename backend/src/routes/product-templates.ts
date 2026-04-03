import { eq } from 'drizzle-orm';
import express from 'express';

import { db, productTemplates, productTemplateAttributes, attributes } from '../db';
import { LogService } from '../core/logger/logger.service';

export const productTemplatesRouter = express.Router();

productTemplatesRouter.get('/', async (req, res) => {
  try {
    const templates = await db.select().from(productTemplates).orderBy(productTemplates.name).all();
    
    // Fetch attributes for each template
    const templatesWithAttributes = await Promise.all(
      templates.map(async (tmpl) => {
        const mappedAttrs = await db.select({
          id: productTemplateAttributes.id,
          attributeId: productTemplateAttributes.attributeId,
          name: attributes.name,
          type: attributes.type,
          isVariantDefining: productTemplateAttributes.isVariantDefining,
        })
        .from(productTemplateAttributes)
        .innerJoin(attributes, eq(attributes.id, productTemplateAttributes.attributeId))
        .where(eq(productTemplateAttributes.templateId, tmpl.id))
        .all();

        return {
          ...tmpl,
          mappedAttributes: mappedAttrs,
        };
      })
    );

    res.json(templatesWithAttributes);
  } catch (error) {
    LogService.error('Failed to fetch product templates', error);
    res.status(500).json({ error: 'Failed to fetch product templates' });
  }
});

productTemplatesRouter.post('/', async (req, res) => {
  const { name, description, mappedAttributes } = req.body;

  if (!name) return res.status(400).json({ error: 'Name is required' });

  try {
    const template = await db.insert(productTemplates).values({
      name,
      description,
    }).returning().get();

    if (Array.isArray(mappedAttributes)) {
      for (const attr of mappedAttributes) {
        await db.insert(productTemplateAttributes).values({
          templateId: template.id,
          attributeId: attr.attributeId,
          isVariantDefining: attr.isVariantDefining === true,
        }).run();
      }
    }

    res.status(201).json(template);
  } catch (error) {
    LogService.error('Failed to create product template', error);
    res.status(400).json({ error: 'Failed to create product template' });
  }
});

productTemplatesRouter.put('/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { name, description, isActive, mappedAttributes } = req.body;

  const existing = await db.select().from(productTemplates).where(eq(productTemplates.id, id)).get();
  if (!existing) return res.status(404).json({ error: 'Template not found' });

  try {
    const updateData: any = {};
    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (typeof isActive === 'boolean') updateData.isActive = isActive;

    await db.update(productTemplates).set(updateData).where(eq(productTemplates.id, id)).run();

    if (Array.isArray(mappedAttributes)) {
      await db.delete(productTemplateAttributes).where(eq(productTemplateAttributes.templateId, id)).run();
      for (const attr of mappedAttributes) {
        await db.insert(productTemplateAttributes).values({
          templateId: id,
          attributeId: attr.attributeId,
          isVariantDefining: attr.isVariantDefining === true,
        }).run();
      }
    }

    const updated = await db.select().from(productTemplates).where(eq(productTemplates.id, id)).get();
    res.json(updated);
  } catch (error) {
    LogService.error('Failed to update product template', error);
    res.status(400).json({ error: 'Failed to update product template' });
  }
});

productTemplatesRouter.delete('/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);

  try {
    await db.delete(productTemplateAttributes).where(eq(productTemplateAttributes.templateId, id)).run();
    await db.delete(productTemplates).where(eq(productTemplates.id, id)).run();
    res.status(204).send();
  } catch (error) {
    LogService.error('Failed to delete product template', error);
    res.status(400).json({ error: 'Failed to delete product template' });
  }
});
