PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_supplier_banks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`supplier_id` integer NOT NULL,
	`bank_name` text NOT NULL,
	`account_number` text NOT NULL,
	`ifsc_code` text NOT NULL,
	`branch_name` text NOT NULL,
	`is_primary` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`supplier_id`) REFERENCES `suppliers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_supplier_banks`("id", "supplier_id", "bank_name", "account_number", "ifsc_code", "branch_name", "is_primary") SELECT "id", "supplier_id", "bank_name", "account_number", "ifsc_code", "branch_name", "is_primary" FROM `supplier_banks`;--> statement-breakpoint
DROP TABLE `supplier_banks`;--> statement-breakpoint
ALTER TABLE `__new_supplier_banks` RENAME TO `supplier_banks`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `supplier_bank_supplier_id_idx` ON `supplier_banks` (`supplier_id`);