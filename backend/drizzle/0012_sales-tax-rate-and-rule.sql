CREATE TABLE `tax_rates` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`rate` integer NOT NULL,
	`cgst_rate` integer NOT NULL,
	`sgst_rate` integer NOT NULL,
	`igst_rate` integer NOT NULL,
	`cess_rate` integer NOT NULL,
	`cess_amount` integer NOT NULL,
	`effective_from` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `tax_rules` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`hsn_code_starts_with` text(20) NOT NULL,
	`min_price` integer NOT NULL,
	`max_price` integer NOT NULL,
	`tax_rate` integer NOT NULL,
	`effective_from` text NOT NULL
);
