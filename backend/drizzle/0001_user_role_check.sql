PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`username` text(16) NOT NULL,
	`password_hash` text NOT NULL,
	`first_name` text(50),
	`last_name` text(50),
	`role` text(16),
	`is_active` integer DEFAULT true,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP),
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP),
	CONSTRAINT "role_must_be_listed" CHECK("__new_users"."role" IN ('user', 'manager', 'admin'))
);
--> statement-breakpoint
INSERT INTO `__new_users`("id", "username", "password_hash", "first_name", "last_name", "role", "is_active", "created_at", "updated_at") SELECT "id", "username", "password_hash", "first_name", "last_name", "role", "is_active", "created_at", "updated_at" FROM `users`;--> statement-breakpoint
DROP TABLE `users`;--> statement-breakpoint
ALTER TABLE `__new_users` RENAME TO `users`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);