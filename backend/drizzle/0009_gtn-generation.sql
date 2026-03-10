PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_stock_invoice_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`stock_invoice_id` integer NOT NULL,
	`inventory_id` integer NOT NULL,
	`qty` numeric,
	`unit_price` numeric,
	`total_amount` numeric,
	FOREIGN KEY (`stock_invoice_id`) REFERENCES `stock_invoices`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`inventory_id`) REFERENCES `inventories`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_stock_invoice_items`("id", "stock_invoice_id", "inventory_id", "qty", "unit_price", "total_amount") SELECT "id", "stock_invoice_id", "product_id", "qty", "unit_price", "total_amount" FROM `stock_invoice_items`;--> statement-breakpoint
DROP TABLE `stock_invoice_items`;--> statement-breakpoint
ALTER TABLE `__new_stock_invoice_items` RENAME TO `stock_invoice_items`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
ALTER TABLE `products` ADD `gtn_generation` text(20);
