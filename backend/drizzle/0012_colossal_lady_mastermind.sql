PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_sales_invoice_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`sales_invoice_id` integer NOT NULL,
	`inventory_id` integer NOT NULL,
	`qty` numeric,
	`unit_price` numeric,
	`discount_by` text(20),
	`discount_pct` numeric,
	`discount_amount` numeric,
	`tax_pct` numeric,
	`tax_amount` numeric,
	`line_total` numeric,
	FOREIGN KEY (`sales_invoice_id`) REFERENCES `sales_invoices`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`inventory_id`) REFERENCES `inventories`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_sales_invoice_items`("id", "sales_invoice_id", "inventory_id", "qty", "unit_price", "discount_by", "discount_pct", "discount_amount", "tax_pct", "tax_amount", "line_total") SELECT "id", "sales_invoice_id", "inventory_id", "qty", "unit_price", "discount_by", "discount_pct", "discount_amount", "tax_pct", "tax_amount", "line_total" FROM `sales_invoice_items`;--> statement-breakpoint
DROP TABLE `sales_invoice_items`;--> statement-breakpoint
ALTER TABLE `__new_sales_invoice_items` RENAME TO `sales_invoice_items`;--> statement-breakpoint
PRAGMA foreign_keys=ON;