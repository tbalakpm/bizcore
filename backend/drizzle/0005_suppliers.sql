CREATE TABLE `address` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`address_line_1` text(255),
	`address_line_2` text(255),
	`area` text(20),
	`city` text(20),
	`taluk` text(20),
	`district` text(20),
	`state` text(20),
	`country` text(20),
	`postal_code` text(20),
	`phone` text(20),
	`mobile` text(20),
	`email` text(100),
	`website` text(100),
	`latitude` text(20),
	`longitude` text(20)
);
--> statement-breakpoint
CREATE INDEX `address_city` ON `address` (`city`);--> statement-breakpoint
CREATE INDEX `address_mobile` ON `address` (`mobile`);--> statement-breakpoint
CREATE TABLE `suppliers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`code` text(16) NOT NULL,
	`name` text(50) NOT NULL,
	`notes` text(255),
	`billing_address_id` integer,
	`shipping_address_id` integer,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`billing_address_id`) REFERENCES `address`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`shipping_address_id`) REFERENCES `address`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `suppliers_code_unique` ON `suppliers` (`code`);--> statement-breakpoint
CREATE UNIQUE INDEX `suppliers_name_unique` ON `suppliers` (`name`);--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_customers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`code` text(16) NOT NULL,
	`name` text(50) NOT NULL,
	`type` text(16) DEFAULT 'retail' NOT NULL,
	`notes` text(255),
	`billing_address_id` integer,
	`shipping_address_id` integer,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`billing_address_id`) REFERENCES `address`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`shipping_address_id`) REFERENCES `address`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "type_must_be_in_list" CHECK("__new_customers"."type" IN ('retail','wholesale'))
);
--> statement-breakpoint
INSERT INTO `__new_customers`("id", "code", "name", "type", "notes", "is_active", "created_at", "updated_at") SELECT "id", "code", "name", "type", "notes", "is_active", "created_at", "updated_at" FROM `customers`;--> statement-breakpoint
DROP TABLE `customers`;--> statement-breakpoint
ALTER TABLE `__new_customers` RENAME TO `customers`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `customers_code_unique` ON `customers` (`code`);--> statement-breakpoint
CREATE UNIQUE INDEX `customers_name_unique` ON `customers` (`name`);--> statement-breakpoint
CREATE TABLE `__new_users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`username` text(16) NOT NULL,
	`password_hash` text(255) NOT NULL,
	`first_name` text(50),
	`last_name` text(50),
	`role` text(16) DEFAULT 'user' NOT NULL,
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
