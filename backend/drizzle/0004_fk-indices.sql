DROP INDEX `address_city`;--> statement-breakpoint
DROP INDEX `address_mobile`;--> statement-breakpoint
CREATE INDEX `address_city_idx` ON `addresses` (`city`);--> statement-breakpoint
CREATE INDEX `address_phone_idx` ON `addresses` (`phone`);--> statement-breakpoint
CREATE INDEX `address_mobile_idx` ON `addresses` (`mobile`);--> statement-breakpoint
CREATE INDEX `address_email_idx` ON `addresses` (`email`);--> statement-breakpoint
DROP INDEX `product_serial_numbers_product_id`;--> statement-breakpoint
CREATE UNIQUE INDEX `product_serial_numbers_product_id_unique` ON `product_serial_numbers` (`product_id`);--> statement-breakpoint
DROP INDEX `purchase_invoices_invoice_date`;--> statement-breakpoint
DROP INDEX `purchase_invoices_ref_number`;--> statement-breakpoint
CREATE INDEX `purchase_invoices_supplier_id_idx` ON `purchase_invoices` (`supplier_id`);--> statement-breakpoint
CREATE INDEX `purchase_invoices_invoice_date_idx` ON `purchase_invoices` (`invoice_date`);--> statement-breakpoint
CREATE INDEX `purchase_invoices_ref_number_idx` ON `purchase_invoices` (`ref_number`);--> statement-breakpoint
DROP INDEX `sales_invoices_invoice_date`;--> statement-breakpoint
DROP INDEX `sales_invoices_ref_number`;--> statement-breakpoint
DROP INDEX `sales_invoices_irn`;--> statement-breakpoint
DROP INDEX `sales_invoices_ack_no`;--> statement-breakpoint
CREATE INDEX `sales_invoices_invoice_date_idx` ON `sales_invoices` (`invoice_date`);--> statement-breakpoint
CREATE INDEX `sales_invoices_customer_id_idx` ON `sales_invoices` (`customer_id`);--> statement-breakpoint
CREATE INDEX `sales_invoices_ref_number_idx` ON `sales_invoices` (`ref_number`);--> statement-breakpoint
CREATE INDEX `sales_invoices_irn_idx` ON `sales_invoices` (`irn`);--> statement-breakpoint
CREATE INDEX `sales_invoices_ack_no_idx` ON `sales_invoices` (`ack_no`);--> statement-breakpoint
CREATE INDEX `customers_billing_address_id_idx` ON `customers` (`billing_address_id`);--> statement-breakpoint
CREATE INDEX `customers_shipping_address_id_idx` ON `customers` (`shipping_address_id`);--> statement-breakpoint
CREATE INDEX `cusotomers_gstin_idx` ON `customers` (`gstin`);--> statement-breakpoint
CREATE INDEX `inventories_product_id_idx` ON `inventories` (`product_id`);--> statement-breakpoint
CREATE INDEX `products_category_id_idx` ON `products` (`category_id`);--> statement-breakpoint
CREATE INDEX `purchase_invoice_items_purchase_invoice_id_idx` ON `purchase_invoice_items` (`purchase_invoice_id`);--> statement-breakpoint
CREATE INDEX `purchase_invoice_items_inventory_id_idx` ON `purchase_invoice_items` (`inventory_id`);--> statement-breakpoint
CREATE INDEX `sales_invoice_items_sales_invoice_id_idx` ON `sales_invoice_items` (`sales_invoice_id`);--> statement-breakpoint
CREATE INDEX `sales_invoice_items_inventory_id_idx` ON `sales_invoice_items` (`inventory_id`);--> statement-breakpoint
CREATE INDEX `stock_invoice_items_stock_invoice_id_idx` ON `stock_invoice_items` (`stock_invoice_id`);--> statement-breakpoint
CREATE INDEX `stock_invoice_items_inventory_id_idx` ON `stock_invoice_items` (`inventory_id`);--> statement-breakpoint
CREATE INDEX `stock_invoices_invoice_date_idx` ON `stock_invoices` (`invoice_date`);--> statement-breakpoint
CREATE INDEX `suppliers_billing_address_id_idx` ON `suppliers` (`billing_address_id`);--> statement-breakpoint
CREATE INDEX `suppliers_shipping_address_id_idx` ON `suppliers` (`shipping_address_id`);--> statement-breakpoint
CREATE INDEX `suppliers_gstin_idx` ON `suppliers` (`gstin`);