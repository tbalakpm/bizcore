PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_stock_invoice_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`stock_invoice_id` integer NOT NULL,
	`inventory_id` integer NOT NULL,
	`qty` numeric DEFAULT '1' NOT NULL,
	`unit_price` numeric DEFAULT '0.00' NOT NULL,
	`margin_type` text(25) DEFAULT 'none' NOT NULL,
	`margin_pct` numeric DEFAULT '0' NOT NULL,
	`margin_amount` numeric DEFAULT '0.00' NOT NULL,
	`selling_price` numeric DEFAULT '0.00' NOT NULL,
	`line_total` numeric GENERATED ALWAYS AS ((ROUND(qty * unit_price, 2))) VIRTUAL,
	FOREIGN KEY (`stock_invoice_id`) REFERENCES `stock_invoices`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`inventory_id`) REFERENCES `inventories`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_stock_invoice_items`("id", "stock_invoice_id", "inventory_id", "qty", "unit_price") SELECT "id", "stock_invoice_id", "inventory_id", "qty", "unit_price" FROM `stock_invoice_items`;--> statement-breakpoint
DROP TABLE `stock_invoice_items`;--> statement-breakpoint
ALTER TABLE `__new_stock_invoice_items` RENAME TO `stock_invoice_items`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `stock_invoice_items_stock_invoice_id_idx` ON `stock_invoice_items` (`stock_invoice_id`);--> statement-breakpoint
CREATE INDEX `stock_invoice_items_inventory_id_idx` ON `stock_invoice_items` (`inventory_id`);