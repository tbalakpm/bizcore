CREATE TABLE `supplier_banks` (
	`id` integer PRIMARY KEY NOT NULL,
	`supplier_id` integer NOT NULL,
	`bank_name` text NOT NULL,
	`account_number` text NOT NULL,
	`ifsc_code` text NOT NULL,
	`branch_name` text NOT NULL,
	`is_primary` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`supplier_id`) REFERENCES `suppliers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `supplier_bank_supplier_id_idx` ON `supplier_banks` (`supplier_id`);