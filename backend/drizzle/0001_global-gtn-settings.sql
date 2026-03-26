PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_products` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`code` text(20) NOT NULL,
	`name` text(50) NOT NULL,
	`description` text(255),
	`category_id` integer NOT NULL,
	`product_type` text(25) DEFAULT 'simple' NOT NULL,
	`qty_per_unit` text(25) DEFAULT '1' NOT NULL,
	`unit_price` real DEFAULT 0 NOT NULL,
	`hsn_sac` text(25) DEFAULT '' NOT NULL,
	`tax_rate` real DEFAULT 0 NOT NULL,
	`use_global` integer DEFAULT true NOT NULL,
	`gtn_mode` text(25) DEFAULT 'global' NOT NULL,
	`gtn_generation` text(25) DEFAULT 'global' NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_products`("id", "code", "name", "description", "category_id", "product_type", "qty_per_unit", "unit_price", "hsn_sac", "tax_rate", "gtn_mode", "gtn_generation", "is_active", "created_at", "updated_at") SELECT "id", "code", "name", "description", "category_id", "product_type", "qty_per_unit", "unit_price", "hsn_sac", "tax_rate", "gtn_mode", "gtn_generation", "is_active", "created_at", "updated_at" FROM `products`;--> statement-breakpoint
DROP TABLE `products`;--> statement-breakpoint
ALTER TABLE `__new_products` RENAME TO `products`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `products_code_unique` ON `products` (`code`);--> statement-breakpoint
CREATE UNIQUE INDEX `products_name_unique` ON `products` (`name`);--> statement-breakpoint
CREATE INDEX `products_category_id_idx` ON `products` (`category_id`);