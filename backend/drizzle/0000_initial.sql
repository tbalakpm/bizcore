CREATE TABLE `addresses` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`address_line_1` text(255),
	`address_line_2` text(255),
	`area` text(25),
	`city` text(25),
	`taluk` text(25),
	`district` text(25),
	`state` text(25),
	`country` text(25),
	`postal_code` text(25),
	`phone` text(25),
	`mobile` text(25),
	`email` text(100),
	`website` text(100),
	`latitude` text(25),
	`longitude` text(25)
);
--> statement-breakpoint
CREATE INDEX `address_city` ON `addresses` (`city`);--> statement-breakpoint
CREATE INDEX `address_mobile` ON `addresses` (`mobile`);--> statement-breakpoint
CREATE TABLE `categories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`code` text(20) NOT NULL,
	`name` text(50) NOT NULL,
	`description` text(255),
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `categories_code_unique` ON `categories` (`code`);--> statement-breakpoint
CREATE UNIQUE INDEX `categories_name_unique` ON `categories` (`name`);--> statement-breakpoint
CREATE TABLE `customers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`code` text(20) NOT NULL,
	`name` text(50) NOT NULL,
	`type` text(25) DEFAULT 'retail' NOT NULL,
	`gstin` text(25),
	`billing_address_id` integer,
	`shipping_address_id` integer,
	`notes` text(255),
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`billing_address_id`) REFERENCES `addresses`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`shipping_address_id`) REFERENCES `addresses`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "type_must_be_in_list" CHECK("customers"."type" IN ('retail','wholesale'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `customers_code_unique` ON `customers` (`code`);--> statement-breakpoint
CREATE UNIQUE INDEX `customers_name_unique` ON `customers` (`name`);--> statement-breakpoint
CREATE TABLE `inventories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`product_id` integer NOT NULL,
	`gtn` text(25),
	`qty_per_unit` text(25),
	`hsn_sac` text(25),
	`tax_rate` numeric,
	`buying_price` numeric,
	`selling_price` numeric,
	`units_in_stock` integer,
	`location` text(255),
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `inventories_product_id` ON `inventories` (`product_id`);--> statement-breakpoint
CREATE TABLE `product_serial_numbers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`product_id` integer,
	`prefix` text(10) DEFAULT '' NOT NULL,
	`current` integer DEFAULT 1 NOT NULL,
	`length` integer DEFAULT 10 NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `product_serial_numbers_product_id` ON `product_serial_numbers` (`product_id`);--> statement-breakpoint
CREATE TABLE `products` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`code` text(20) NOT NULL,
	`name` text(50) NOT NULL,
	`description` text(255),
	`category_id` integer NOT NULL,
	`qty_per_unit` text(25),
	`unit_price` numeric,
	`hsn_sac` text(25),
	`tax_rate` numeric,
	`gtn_mode` text(25) DEFAULT 'auto' NOT NULL,
	`gtn_generation` text(25) DEFAULT 'code' NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "gtn_mode_must_be_in_list" CHECK("products"."gtn_mode" IN ('auto','manual')),
	CONSTRAINT "gtn_generation_must_be_in_list" CHECK("products"."gtn_generation" IN ('code','batch','tag','manual'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `products_code_unique` ON `products` (`code`);--> statement-breakpoint
CREATE UNIQUE INDEX `products_name_unique` ON `products` (`name`);--> statement-breakpoint
CREATE TABLE `sales_invoice_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`sales_invoice_id` integer NOT NULL,
	`inventory_id` integer NOT NULL,
	`qty` numeric DEFAULT '0.000' NOT NULL,
	`unit_price` numeric DEFAULT '0.00' NOT NULL,
	`discount_type` text(10) DEFAULT 'none' NOT NULL,
	`discount_pct` numeric DEFAULT '0.00' NOT NULL,
	`discount_amount` numeric DEFAULT '0.00' NOT NULL,
	`tax_pct` numeric DEFAULT '0.00' NOT NULL,
	`tax_amount` numeric GENERATED ALWAYS AS ((ROUND((qty * unit_price - discount_amount) * tax_pct / 100, 2))) VIRTUAL,
	`line_total` numeric GENERATED ALWAYS AS ((ROUND((qty * unit_price - discount_amount) + tax_amount, 2))) VIRTUAL,
	FOREIGN KEY (`sales_invoice_id`) REFERENCES `sales_invoices`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`inventory_id`) REFERENCES `inventories`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `sales_invoices` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`invoice_number` text(25) NOT NULL,
	`invoice_date` text(25) NOT NULL,
	`customer_id` integer NOT NULL,
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
	`irn` text(64),
	`ack_no` text(20),
	`ack_date` text(50),
	`signed_qr_code` text,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sales_invoices_invoice_number_unique` ON `sales_invoices` (`invoice_number`);--> statement-breakpoint
CREATE INDEX `sales_invoices_invoice_date` ON `sales_invoices` (`invoice_date`);--> statement-breakpoint
CREATE INDEX `sales_invoices_ref_number` ON `sales_invoices` (`ref_number`);--> statement-breakpoint
CREATE INDEX `sales_invoices_irn` ON `sales_invoices` (`irn`);--> statement-breakpoint
CREATE INDEX `sales_invoices_ack_no` ON `sales_invoices` (`ack_no`);--> statement-breakpoint
CREATE TABLE `serial_numbers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`key` text(25) NOT NULL,
	`prefix` text(10) DEFAULT '' NOT NULL,
	`current` integer DEFAULT 1 NOT NULL,
	`length` integer DEFAULT 10 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `serial_numbers_key_unique` ON `serial_numbers` (`key`);--> statement-breakpoint
CREATE TABLE `settings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`key` text(50) NOT NULL,
	`value` text(255) DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `settings_key_unique` ON `settings` (`key`);--> statement-breakpoint
CREATE TABLE `stock_invoice_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`stock_invoice_id` integer NOT NULL,
	`inventory_id` integer NOT NULL,
	`qty` numeric,
	`unit_price` numeric,
	`line_total` numeric,
	FOREIGN KEY (`stock_invoice_id`) REFERENCES `stock_invoices`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`inventory_id`) REFERENCES `inventories`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `stock_invoices` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`invoice_number` text(20) NOT NULL,
	`invoice_date` text(20) NOT NULL,
	`total_qty` numeric DEFAULT '0.000' NOT NULL,
	`total_amount` numeric DEFAULT '0.00' NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `stock_invoices_invoice_number_unique` ON `stock_invoices` (`invoice_number`);--> statement-breakpoint
CREATE TABLE `suppliers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`code` text(20) NOT NULL,
	`name` text(50) NOT NULL,
	`gstin` text(25),
	`billing_address_id` integer,
	`shipping_address_id` integer,
	`notes` text(255),
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`billing_address_id`) REFERENCES `addresses`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`shipping_address_id`) REFERENCES `addresses`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `suppliers_code_unique` ON `suppliers` (`code`);--> statement-breakpoint
CREATE UNIQUE INDEX `suppliers_name_unique` ON `suppliers` (`name`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`username` text(20) NOT NULL,
	`password_hash` text(255) NOT NULL,
	`first_name` text(50),
	`last_name` text(50),
	`role` text(20) DEFAULT 'user' NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	CONSTRAINT "role_must_be_in_list" CHECK("users"."role" IN ('user', 'manager', 'admin'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);