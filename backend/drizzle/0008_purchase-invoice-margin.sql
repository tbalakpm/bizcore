ALTER TABLE `stock_invoice_items` RENAME COLUMN "margin_value" TO "margin_pct";--> statement-breakpoint
ALTER TABLE `stock_invoice_items` DROP COLUMN `line_total`;--> statement-breakpoint
ALTER TABLE `stock_invoice_items` ADD `line_total` numeric GENERATED ALWAYS AS ((ROUND(qty * unit_price, 2))) VIRTUAL;--> statement-breakpoint
ALTER TABLE `purchase_invoice_items` ADD `margin_type` text(25) DEFAULT 'none' NOT NULL;--> statement-breakpoint
ALTER TABLE `purchase_invoice_items` ADD `margin_pct` numeric DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE `purchase_invoice_items` ADD `margin_amount` numeric DEFAULT '0.00' NOT NULL;--> statement-breakpoint
ALTER TABLE `purchase_invoice_items` ADD `selling_price` numeric DEFAULT '0.00' NOT NULL;