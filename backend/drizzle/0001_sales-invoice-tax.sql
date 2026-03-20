PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_sales_invoices` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`invoice_number` text(25) NOT NULL,
	`invoice_date` text(25) NOT NULL,
	`customer_id` integer NOT NULL,
	`ref_number` text(25),
	`ref_date` text(25),
	`total_qty` numeric DEFAULT '0.000' NOT NULL,
	`subtotal` numeric DEFAULT '0.00' NOT NULL,
	`discount_type` text(20) DEFAULT 'none' NOT NULL,
	`discount_pct` numeric DEFAULT '0.00' NOT NULL,
	`discount_amount` numeric DEFAULT '0.00' NOT NULL,
	`total_tax_amount` numeric DEFAULT '0.00' NOT NULL,
	`round_off` numeric DEFAULT '0.00' NOT NULL,
	`net_amount` numeric GENERATED ALWAYS AS ((ROUND(subtotal - discount_amount + total_tax_amount + round_off, 2))) VIRTUAL,
	`irn` text(64),
	`ack_no` text(20),
	`ack_date` text(50),
	`signed_qr_code` text,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_sales_invoices`("id", "invoice_number", "invoice_date", "customer_id", "ref_number", "ref_date", "total_qty", "subtotal", "discount_type", "discount_pct", "discount_amount", "total_tax_amount", "round_off", "irn", "ack_no", "ack_date", "signed_qr_code") 
	SELECT "id", "invoice_number", "invoice_date", "customer_id", "ref_number", "ref_date", "total_qty", "subtotal", "discount_type", "discount_pct", "discount_amount", "tax_amount", "round_off", "irn", "ack_no", "ack_date", "signed_qr_code" FROM `sales_invoices`;--> statement-breakpoint
DROP TABLE `sales_invoices`;--> statement-breakpoint
ALTER TABLE `__new_sales_invoices` RENAME TO `sales_invoices`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `sales_invoices_invoice_number_unique` ON `sales_invoices` (`invoice_number`);--> statement-breakpoint
CREATE INDEX `sales_invoices_invoice_date_idx` ON `sales_invoices` (`invoice_date`);--> statement-breakpoint
CREATE INDEX `sales_invoices_customer_id_idx` ON `sales_invoices` (`customer_id`);--> statement-breakpoint
CREATE INDEX `sales_invoices_ref_number_idx` ON `sales_invoices` (`ref_number`);--> statement-breakpoint
CREATE INDEX `sales_invoices_irn_idx` ON `sales_invoices` (`irn`);--> statement-breakpoint
CREATE INDEX `sales_invoices_ack_no_idx` ON `sales_invoices` (`ack_no`);