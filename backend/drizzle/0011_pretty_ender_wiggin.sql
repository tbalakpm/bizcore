ALTER TABLE `sales_invoice_items` ADD `inventory_id` integer REFERENCES inventories(id);--> statement-breakpoint
ALTER TABLE `sales_invoices` ADD `irn` text(64);--> statement-breakpoint
ALTER TABLE `sales_invoices` ADD `ack_no` text(20);--> statement-breakpoint
ALTER TABLE `sales_invoices` ADD `ack_date` text(50);--> statement-breakpoint
ALTER TABLE `sales_invoices` ADD `signed_qr_code` text;