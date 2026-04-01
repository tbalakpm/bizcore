CREATE TABLE `audit_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer,
	`request_id` text(36),
	`action` text(100) NOT NULL,
	`entity` text(100) NOT NULL,
	`entity_id` text(100) NOT NULL,
	`old_value` text,
	`new_value` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL
);
