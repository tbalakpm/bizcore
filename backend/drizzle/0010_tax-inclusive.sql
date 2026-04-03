ALTER TABLE `products` ADD `is_tax_inclusive` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `sales_invoices` ADD `is_tax_inclusive` integer DEFAULT false NOT NULL;