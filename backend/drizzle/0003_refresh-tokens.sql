CREATE TABLE `refresh_tokens` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`token_hash` text(64) NOT NULL,
	`expires_at` integer NOT NULL,
	`revoked_at` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `refresh_tokens_token_hash_unique` ON `refresh_tokens` (`token_hash`);