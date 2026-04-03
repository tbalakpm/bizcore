CREATE TABLE `brand_categories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`brand_id` integer NOT NULL,
	`category_id` integer NOT NULL,
	FOREIGN KEY (`brand_id`) REFERENCES `brands`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `brand_categories_brand_id_idx` ON `brand_categories` (`brand_id`);--> statement-breakpoint
CREATE INDEX `brand_categories_category_id_idx` ON `brand_categories` (`category_id`);