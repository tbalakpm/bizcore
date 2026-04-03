CREATE TABLE `states` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`state_name` text(100) NOT NULL,
	`state_code` text(2) NOT NULL,
	`state_short_code` text(5) NOT NULL,
	`country_code` text(2) DEFAULT 'IN' NOT NULL,
	`is_union_territory` integer DEFAULT false,
	`is_active` integer DEFAULT true
);
