CREATE TABLE `purchase_invoices` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`invoice_number` text(25) NOT NULL,
	`invoice_date` text(25) NOT NULL,
	`supplier_id` integer NOT NULL,
	`ref_number` text(25),
	`ref_date` text(25),
	`total_qty` numeric DEFAULT '0.000' NOT NULL,
	`subtotal` numeric DEFAULT '0.00' NOT NULL,
	`discount_type` text(20) DEFAULT 'none' NOT NULL,
	`discount_pct` numeric DEFAULT '0.00' NOT NULL,
	`discount_amount` numeric DEFAULT '0.00' NOT NULL,
	`tax_pct` numeric DEFAULT '0.00' NOT NULL,
	`tax_amount` numeric GENERATED ALWAYS AS ((ROUND((subtotal - discount_amount) * tax_pct / 100, 2))) VIRTUAL,
	`round_off` numeric DEFAULT '0.00' NOT NULL,
	`net_amount` numeric GENERATED ALWAYS AS ((ROUND(subtotal - discount_amount + tax_amount + round_off, 2))) VIRTUAL,
	FOREIGN KEY (`supplier_id`) REFERENCES `suppliers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `purchase_invoices_invoice_number_unique` ON `purchase_invoices` (`invoice_number`);--> statement-breakpoint
CREATE INDEX `purchase_invoices_invoice_date` ON `purchase_invoices` (`invoice_date`);--> statement-breakpoint
CREATE INDEX `purchase_invoices_ref_number` ON `purchase_invoices` (`ref_number`);--> statement-breakpoint
CREATE TABLE `purchase_invoice_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`purchase_invoice_id` integer NOT NULL,
	`inventory_id` integer NOT NULL,
	`qty` numeric DEFAULT '0.000' NOT NULL,
	`unit_price` numeric DEFAULT '0.00' NOT NULL,
	`discount_type` text(10) DEFAULT 'none' NOT NULL,
	`discount_pct` numeric DEFAULT '0.00' NOT NULL,
	`discount_amount` numeric DEFAULT '0.00' NOT NULL,
	`tax_pct` numeric DEFAULT '0.00' NOT NULL,
	`tax_amount` numeric GENERATED ALWAYS AS ((ROUND((qty * unit_price - discount_amount) * tax_pct / 100, 2))) VIRTUAL,
	`line_total` numeric GENERATED ALWAYS AS ((ROUND((qty * unit_price - discount_amount) + tax_amount, 2))) VIRTUAL,
	FOREIGN KEY (`purchase_invoice_id`) REFERENCES `purchase_invoices`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`inventory_id`) REFERENCES `inventories`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_product_serial_numbers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`product_id` integer,
	`prefix` text(50) DEFAULT '' NOT NULL,
	`current` integer DEFAULT 1 NOT NULL,
	`length` integer DEFAULT 10 NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_product_serial_numbers`("id", "product_id", "prefix", "current", "length") SELECT "id", "product_id", "prefix", "current", "length" FROM `product_serial_numbers`;--> statement-breakpoint
DROP TABLE `product_serial_numbers`;--> statement-breakpoint
ALTER TABLE `__new_product_serial_numbers` RENAME TO `product_serial_numbers`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `product_serial_numbers_product_id` ON `product_serial_numbers` (`product_id`);