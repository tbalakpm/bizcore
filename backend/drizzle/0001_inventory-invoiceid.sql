ALTER TABLE `inventories` ADD `invoice_id` integer;--> statement-breakpoint
CREATE INDEX `inventories_invoice_id_idx` ON `inventories` (`invoice_id`);