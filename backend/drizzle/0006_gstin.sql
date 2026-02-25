ALTER TABLE `address` RENAME TO `addresses`;--> statement-breakpoint
CREATE TABLE `inventories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`product_id` integer NOT NULL,
	`gtn` text(20),
	`qty_per_unit` text(20),
	`hsn_sac` text(20),
	`tax_rate` numeric,
	`buying_price` numeric,
	`selling_price` numeric,
	`units_in_stock` integer,
	`location` text(255),
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `inventories_product_id` ON `inventories` (`product_id`);--> statement-breakpoint
CREATE TABLE `settings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`key` text(50) NOT NULL,
	`value` text(255)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `settings_key_unique` ON `settings` (`key`);--> statement-breakpoint
CREATE TABLE `serial_numbers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`key` text(20) NOT NULL,
	`prefix` text(20),
	`current` integer DEFAULT 1 NOT NULL,
	`length` integer DEFAULT 10 NOT NULL,
	`serial_number` text(50) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `stock_invoice_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`stock_invoice_id` integer NOT NULL,
	`product_id` integer NOT NULL,
	`qty` numeric,
	`unit_price` numeric,
	`total_amount` numeric,
	FOREIGN KEY (`stock_invoice_id`) REFERENCES `stock_invoices`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `stock_invoices` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`invoice_number` text(20) NOT NULL,
	`invoice_date` text(20) NOT NULL,
	`total_qty` numeric,
	`total_amount` numeric
);
--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_customers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`code` text(20) NOT NULL,
	`name` text(50) NOT NULL,
	`type` text(20) DEFAULT 'retail' NOT NULL,
	`notes` text(255),
	`gstin` text(20),
	`billing_address_id` integer,
	`shipping_address_id` integer,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`billing_address_id`) REFERENCES `addresses`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`shipping_address_id`) REFERENCES `addresses`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "type_must_be_in_list" CHECK("__new_customers"."type" IN ('retail','wholesale'))
);
--> statement-breakpoint
INSERT INTO `__new_customers`("id", "code", "name", "type", "notes", "billing_address_id", "shipping_address_id", "is_active", "created_at", "updated_at") SELECT "id", "code", "name", "type", "notes", "billing_address_id", "shipping_address_id", "is_active", "created_at", "updated_at" FROM `customers`;--> statement-breakpoint
DROP TABLE `customers`;--> statement-breakpoint
ALTER TABLE `__new_customers` RENAME TO `customers`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `customers_code_unique` ON `customers` (`code`);--> statement-breakpoint
CREATE UNIQUE INDEX `customers_name_unique` ON `customers` (`name`);--> statement-breakpoint
CREATE TABLE `__new_suppliers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`code` text(20) NOT NULL,
	`name` text(50) NOT NULL,
	`notes` text(255),
	`gstin` text(20),
	`billing_address_id` integer,
	`shipping_address_id` integer,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`billing_address_id`) REFERENCES `addresses`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`shipping_address_id`) REFERENCES `addresses`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_suppliers`("id", "code", "name", "notes", "billing_address_id", "shipping_address_id", "is_active", "created_at", "updated_at") SELECT "id", "code", "name", "notes", "billing_address_id", "shipping_address_id", "is_active", "created_at", "updated_at" FROM `suppliers`;--> statement-breakpoint
DROP TABLE `suppliers`;--> statement-breakpoint
ALTER TABLE `__new_suppliers` RENAME TO `suppliers`;--> statement-breakpoint
CREATE UNIQUE INDEX `suppliers_code_unique` ON `suppliers` (`code`);--> statement-breakpoint
CREATE UNIQUE INDEX `suppliers_name_unique` ON `suppliers` (`name`);--> statement-breakpoint
CREATE TABLE `__new_categories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`code` text(20) NOT NULL,
	`name` text(50) NOT NULL,
	`description` text(255),
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_categories`("id", "code", "name", "description", "is_active", "created_at", "updated_at") SELECT "id", "code", "name", "description", "is_active", "created_at", "updated_at" FROM `categories`;--> statement-breakpoint
DROP TABLE `categories`;--> statement-breakpoint
ALTER TABLE `__new_categories` RENAME TO `categories`;--> statement-breakpoint
CREATE UNIQUE INDEX `categories_code_unique` ON `categories` (`code`);--> statement-breakpoint
CREATE UNIQUE INDEX `categories_name_unique` ON `categories` (`name`);--> statement-breakpoint
CREATE TABLE `__new_products` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`code` text(20) NOT NULL,
	`name` text(50) NOT NULL,
	`description` text(255),
	`category_id` integer NOT NULL,
	`qty_per_unit` text(20),
	`unit_price` numeric,
	`hsn_sac` text(20),
	`tax_rate` numeric,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_products`("id", "code", "name", "description", "category_id", "qty_per_unit", "unit_price", "is_active", "created_at", "updated_at") SELECT "id", "code", "name", "description", "category_id", "qty_per_unit", "unit_price", "is_active", "created_at", "updated_at" FROM `products`;--> statement-breakpoint
DROP TABLE `products`;--> statement-breakpoint
ALTER TABLE `__new_products` RENAME TO `products`;--> statement-breakpoint
CREATE UNIQUE INDEX `products_code_unique` ON `products` (`code`);--> statement-breakpoint
CREATE UNIQUE INDEX `products_name_unique` ON `products` (`name`);--> statement-breakpoint
CREATE TABLE `__new_users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`username` text(20) NOT NULL,
	`password_hash` text(255) NOT NULL,
	`first_name` text(50),
	`last_name` text(50),
	`role` text(20) DEFAULT 'user' NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	CONSTRAINT "role_must_be_in_list" CHECK("__new_users"."role" IN ('user', 'manager', 'admin'))
);
--> statement-breakpoint
INSERT INTO `__new_users`("id", "username", "password_hash", "first_name", "last_name", "role", "is_active", "created_at", "updated_at") SELECT "id", "username", "password_hash", "first_name", "last_name", "role", "is_active", "created_at", "updated_at" FROM `users`;--> statement-breakpoint
DROP TABLE `users`;--> statement-breakpoint
ALTER TABLE `__new_users` RENAME TO `users`;--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);
