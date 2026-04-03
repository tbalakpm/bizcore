ALTER TABLE `purchase_invoice_items` ADD `sgst_amount` real DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `purchase_invoice_items` ADD `cgst_amount` real DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `purchase_invoice_items` ADD `igst_amount` real DEFAULT 0 NOT NULL;