CREATE TABLE `pricing_categories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`code` text(20) NOT NULL,
	`name` text(50) NOT NULL,
	`description` text(255),
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `pricing_categories_code_unique` ON `pricing_categories` (`code`);--> statement-breakpoint
CREATE UNIQUE INDEX `pricing_categories_name_unique` ON `pricing_categories` (`name`);--> statement-breakpoint
CREATE TABLE `pricing_category_products` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`pricing_category_id` integer NOT NULL,
	`product_id` integer NOT NULL,
	`margin_type` text(25) DEFAULT 'none' NOT NULL,
	`margin_pct` numeric DEFAULT '0' NOT NULL,
	`margin_amount` numeric DEFAULT '0.00' NOT NULL,
	FOREIGN KEY (`pricing_category_id`) REFERENCES `pricing_categories`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `pcp_pricing_category_id_idx` ON `pricing_category_products` (`pricing_category_id`);--> statement-breakpoint
CREATE INDEX `pcp_product_id_idx` ON `pricing_category_products` (`product_id`);--> statement-breakpoint
ALTER TABLE `customers` ADD `pricing_category_id` integer REFERENCES pricing_categories(id);--> statement-breakpoint
CREATE INDEX `customers_pricing_category_id_idx` ON `customers` (`pricing_category_id`);--> statement-breakpoint
ALTER TABLE `sales_invoice_items` ADD `sgst_amount` numeric DEFAULT '0.00' NOT NULL;--> statement-breakpoint
ALTER TABLE `sales_invoice_items` ADD `cgst_amount` numeric DEFAULT '0.00' NOT NULL;--> statement-breakpoint
ALTER TABLE `sales_invoice_items` ADD `igst_amount` numeric DEFAULT '0.00' NOT NULL;