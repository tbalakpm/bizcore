CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`username` text(16) NOT NULL,
	`password_hash` text NOT NULL,
	`first_name` text(50),
	`last_name` text(50),
	`role` text(16),
	`is_active` integer DEFAULT true,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP),
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);