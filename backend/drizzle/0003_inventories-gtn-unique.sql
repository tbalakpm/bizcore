DROP INDEX `inventories_product_id`;--> statement-breakpoint
CREATE UNIQUE INDEX `inventories_gtn_unique` ON `inventories` (`gtn`);