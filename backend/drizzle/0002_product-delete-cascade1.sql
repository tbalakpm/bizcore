PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_product_attribute_values` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`product_id` integer NOT NULL,
	`attribute_id` integer NOT NULL,
	`value` text NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`attribute_id`) REFERENCES `attributes`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_product_attribute_values`("id", "product_id", "attribute_id", "value", "is_active", "created_at", "updated_at") SELECT "id", "product_id", "attribute_id", "value", "is_active", "created_at", "updated_at" FROM `product_attribute_values`;--> statement-breakpoint
DROP TABLE `product_attribute_values`;--> statement-breakpoint
ALTER TABLE `__new_product_attribute_values` RENAME TO `product_attribute_values`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `product_attrv_product_attribute_id_unique` ON `product_attribute_values` (`product_id`,`attribute_id`);--> statement-breakpoint
CREATE INDEX `product_attrv_attribute_id_idx` ON `product_attribute_values` (`attribute_id`);--> statement-breakpoint
CREATE TABLE `__new_product_serial_numbers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`product_id` integer NOT NULL,
	`prefix` text(50) DEFAULT '' NOT NULL,
	`current` integer DEFAULT 1 NOT NULL,
	`length` integer DEFAULT 10 NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_product_serial_numbers`("id", "product_id", "prefix", "current", "length") SELECT "id", "product_id", "prefix", "current", "length" FROM `product_serial_numbers`;--> statement-breakpoint
DROP TABLE `product_serial_numbers`;--> statement-breakpoint
ALTER TABLE `__new_product_serial_numbers` RENAME TO `product_serial_numbers`;--> statement-breakpoint
CREATE UNIQUE INDEX `product_serial_numbers_product_id_unique` ON `product_serial_numbers` (`product_id`);