import { and, asc, desc, eq, like, sql } from "drizzle-orm";
import express, { type Request, type Response } from "express";

import { categories, db } from "../db";

export const categoriesRouter = express.Router();

categoriesRouter.get("/", async (req: Request, res: Response) => {
  try {
    // Pagination
    const limit = Math.min(parseInt(req.query.limit as string, 10) || 10, 100);
    const offsetParam = req.query.offset as string | undefined;
    const pageParam = (req.query.pageNum ?? req.query.page) as
      | string
      | undefined;

    const pageNumRaw = pageParam ? parseInt(pageParam, 10) : NaN;
    const pageNum =
      Number.isFinite(pageNumRaw) && pageNumRaw > 0 ? pageNumRaw : undefined;

    // Backward compatible:
    // - If `offset` is provided, use it.
    // - Else if `page`/`pageNum` is provided, convert to offset.
    const offset = offsetParam
      ? Math.max(parseInt(offsetParam, 10) || 0, 0)
      : Math.max(((pageNum ?? 1) - 1) * limit, 0);

    // Build filters dynamically
    const filters: any[] = [];
    const filterableFields = ["code", "name", "description"] as const;
    const sortableFields = [
      "id",
      ...filterableFields,
      "isActive",
      "createdAt",
      "updatedAt",
    ] as const;
    type SortableField = (typeof sortableFields)[number];
    const isSortableField = (value: string): value is SortableField =>
      (sortableFields as readonly string[]).includes(value);

    for (const field of filterableFields) {
      if (req.query[field]) {
        const column = categories[field];
        if (column) {
          filters.push(like(column as any, `%${req.query[field]}%`));
        }
      }
    }

    // Filter by active status
    if (req.query.isActive !== undefined) {
      const isActive = req.query.isActive === "true";
      filters.push(eq(categories.isActive, isActive));
    }

    // Build sort dynamically
    const orderBy: any[] = [];
    if (req.query.sort) {
      const sortParams = (req.query.sort as string).split(",");
      console.log("Sort params:", sortParams);

      for (const param of sortParams) {
        const [field, direction] = param.split(":");
        const dir = direction?.toLowerCase() === "desc" ? desc : asc;

        if (!field || !isSortableField(field)) {
          console.log(
            field,
            "not sortable - available fields:",
            sortableFields,
          );
          continue;
        }

        console.log("Processing sortable field:", field);
        const column = categories[field];
        if (column) {
          orderBy.push(dir(column));
          console.log("Added to orderBy:", field, direction || "asc");
        } else {
          console.log("Column not found for field:", field);
        }
      }
    } else {
      orderBy.push(desc(categories.id));
    }
    console.log("Final orderBy array length:", orderBy.length);

    // Build the query
    let query = db.select().from(categories);

    if (filters.length > 0) {
      query = query.where(and(...filters)) as any;
    }

    // Get total count
    const countResult = await db
      .select({ count: sql<number>`cast(count(*) as integer)` })
      .from(categories);

    const whereCondition = filters.length > 0 ? and(...filters) : undefined;
    const filteredCount = whereCondition
      ? (
          await db
            .select({ count: sql<number>`cast(count(*) as integer)` })
            .from(categories)
            .where(whereCondition)
        )[0].count
      : countResult[0].count;

    // Get paginated results
    const result = await (query as any)
      .orderBy(...orderBy)
      .limit(limit)
      .offset(offset)
      .all();

    res.json({
      data: result,
      pagination: {
        limit,
        offset,
        total: filteredCount,
        page: pageNum ?? Math.floor(offset / limit) + 1,
        totalPages: Math.ceil(filteredCount / limit),
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});

categoriesRouter.get("/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id as string, 10);
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: "Invalid category ID" });
  }

  const category = await db
    .select()
    .from(categories)
    .where(eq(categories.id, id))
    .get();
  if (!category)
    return res.status(404).json({
      error: req.i18n?.t("category.notFound") || "Category not found",
    });

  res.json(category);
});

categoriesRouter.post("/", async (req, res) => {
  const { code, name, description, isActive } = req.body;

  if (!name) return res.status(400).json({ error: "Name is required" });
  if (!code) return res.status(400).json({ error: "Code is required" });
  if (!req.user?.id)
    return res.status(401).json({ error: "User not authenticated" });

  try {
    const category = await db
      .insert(categories)
      .values({
        code,
        name,
        description,
        isActive: isActive !== false,
      })
      .returning()
      .get();

    res.status(201).json(category);
  } catch (err) {
    console.error(err);
    res.status(400).json({
      error: req.i18n?.t("category.exists") || "Category already exists",
    });
  }
});

categoriesRouter.put("/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);

  const category = await db
    .select()
    .from(categories)
    .where(eq(categories.id, id))
    .get();
  if (!category)
    return res.status(404).json({
      error: req.i18n?.t("category.notFound") || "Category not found",
    });

  const { code, name, description, isActive } = req.body;
  if (code !== undefined) category.code = code;
  if (name !== undefined) category.name = name;
  if (description !== undefined) category.description = description;
  if (typeof isActive === "boolean") category.isActive = isActive;

  await db
    .update(categories)
    .set({
      code: category.code,
      name: category.name,
      description: category.description,
      isActive: category.isActive,
    })
    .where(eq(categories.id, id))
    .run();

  res.json(category);
});

categoriesRouter.delete("/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);

  const category = await db
    .select({ id: categories.id })
    .from(categories)
    .where(eq(categories.id, id))
    .get();
  if (!category)
    return res.status(404).json({
      error: req.i18n?.t("category.notFound") || "Category not found",
    });

  await db.delete(categories).where(eq(categories.id, id)).run();
  res.status(204).send();
});
