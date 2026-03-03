CREATE TABLE `product_serial_numbers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`key` text(100) NOT NULL,
	`serial_type` text(20) NOT NULL,
	`mode` text(30) DEFAULT 'global_product_serial' NOT NULL,
	`product_id` integer,
	`prefix` text(50) DEFAULT '' NOT NULL,
	`current` integer DEFAULT 1 NOT NULL,
	`length` integer DEFAULT 6 NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "product_serial_numbers_serial_type_check" CHECK("product_serial_numbers"."serial_type" IN ('tag_number', 'batch_number')),
	CONSTRAINT "product_serial_numbers_mode_check" CHECK("product_serial_numbers"."mode" IN ('global_product_serial', 'each_product', 'product_code_as_tag_batch'))
);
--> statement-breakpoint
CREATE INDEX `product_serial_numbers_product_id` ON `product_serial_numbers` (`product_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `product_serial_numbers_key_unique` ON `product_serial_numbers` (`key`);--> statement-breakpoint
CREATE TABLE `sales_invoice_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`sales_invoice_id` integer NOT NULL,
	`product_id` integer NOT NULL,
	`qty` numeric,
	`unit_price` numeric,
	`discount_by` text(20),
	`discount_pct` numeric,
	`discount_amount` numeric,
	`tax_pct` numeric,
	`tax_amount` numeric,
	`line_total` numeric,
	FOREIGN KEY (`sales_invoice_id`) REFERENCES `sales_invoices`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `sales_invoices` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`invoice_number` text(20) NOT NULL,
	`invoice_date` text(20) NOT NULL,
	`customer_id` integer NOT NULL,
	`ref_number` text(20),
	`ref_date` text(20),
	`total_qty` numeric,
	`subtotal` numeric,
	`discount_by` text(20),
	`discount_pct` numeric,
	`discount_amount` numeric,
	`tax_pct` numeric,
	`tax_amount` numeric,
	`net_amount` numeric,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action
);
