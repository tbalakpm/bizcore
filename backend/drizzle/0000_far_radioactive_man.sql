CREATE TABLE `addresses` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`address_line_1` text(255),
	`address_line_2` text(255),
	`area` text(25),
	`city` text(25),
	`taluk` text(25),
	`district` text(25),
	`state` text(25),
	`country` text(25),
	`postal_code` text(25),
	`phone` text(25),
	`mobile` text(25),
	`email` text(100),
	`website` text(100),
	`latitude` text(25),
	`longitude` text(25)
);
--> statement-breakpoint
CREATE INDEX `address_city_idx` ON `addresses` (`city`);--> statement-breakpoint
CREATE INDEX `address_phone_idx` ON `addresses` (`phone`);--> statement-breakpoint
CREATE INDEX `address_mobile_idx` ON `addresses` (`mobile`);--> statement-breakpoint
CREATE INDEX `address_email_idx` ON `addresses` (`email`);--> statement-breakpoint
CREATE TABLE `attributes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text(50) NOT NULL,
	`description` text(255),
	`type` text NOT NULL,
	`options` text,
	`default_value` text(255),
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `audit_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer,
	`request_id` text(36),
	`action` text(100) NOT NULL,
	`entity` text(100) NOT NULL,
	`entity_id` text(100) NOT NULL,
	`old_value` text,
	`new_value` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `brand_categories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`brand_id` integer NOT NULL,
	`category_id` integer NOT NULL,
	FOREIGN KEY (`brand_id`) REFERENCES `brands`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `brand_categories_brand_id_category_id_unique` ON `brand_categories` (`brand_id`,`category_id`);--> statement-breakpoint
CREATE INDEX `brand_categories_category_id_idx` ON `brand_categories` (`category_id`);--> statement-breakpoint
CREATE TABLE `brands` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`code` text(20) NOT NULL,
	`name` text(50) NOT NULL,
	`description` text(255),
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `brands_code_unique` ON `brands` (`code`);--> statement-breakpoint
CREATE UNIQUE INDEX `brands_name_unique` ON `brands` (`name`);--> statement-breakpoint
CREATE TABLE `categories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`code` text(20) NOT NULL,
	`name` text(50) NOT NULL,
	`description` text(255),
	`parent_category_id` integer,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`parent_category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `categories_code_unique` ON `categories` (`code`);--> statement-breakpoint
CREATE UNIQUE INDEX `categories_name_unique` ON `categories` (`name`);--> statement-breakpoint
CREATE TABLE `customers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`code` text(20) NOT NULL,
	`name` text(50) NOT NULL,
	`type` text(25) DEFAULT 'retail' NOT NULL,
	`gstin` text(25),
	`pricing_category_id` integer,
	`billing_address_id` integer,
	`shipping_address_id` integer,
	`notes` text(255),
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`pricing_category_id`) REFERENCES `pricing_categories`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`billing_address_id`) REFERENCES `addresses`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`shipping_address_id`) REFERENCES `addresses`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "type_must_be_in_list" CHECK("customers"."type" IN ('retail','wholesale'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `customers_code_unique` ON `customers` (`code`);--> statement-breakpoint
CREATE UNIQUE INDEX `customers_name_unique` ON `customers` (`name`);--> statement-breakpoint
CREATE INDEX `customers_billing_address_id_idx` ON `customers` (`billing_address_id`);--> statement-breakpoint
CREATE INDEX `customers_shipping_address_id_idx` ON `customers` (`shipping_address_id`);--> statement-breakpoint
CREATE INDEX `cusotomers_gstin_idx` ON `customers` (`gstin`);--> statement-breakpoint
CREATE INDEX `customers_pricing_category_id_idx` ON `customers` (`pricing_category_id`);--> statement-breakpoint
CREATE TABLE `hsn_sac_codes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`hsn_sac_code` text(25),
	`tax_rate_id` integer NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`tax_rate_id`) REFERENCES `tax_rates`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `hsn_sac_code_idx` ON `hsn_sac_codes` (`hsn_sac_code`);--> statement-breakpoint
CREATE INDEX `hsn_sac_code_tax_rate_id_idx` ON `hsn_sac_codes` (`tax_rate_id`);--> statement-breakpoint
CREATE TABLE `inventories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`invoice_id` integer,
	`product_id` integer NOT NULL,
	`gtn` text(25) DEFAULT '' NOT NULL,
	`qty_per_unit` text(25) DEFAULT '1' NOT NULL,
	`hsn_sac` text(25) DEFAULT '' NOT NULL,
	`tax_rate` real DEFAULT 0 NOT NULL,
	`buying_price` real DEFAULT 0 NOT NULL,
	`selling_price` real DEFAULT 0 NOT NULL,
	`units_in_stock` integer DEFAULT 0 NOT NULL,
	`location` text(255) DEFAULT '' NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `inventories_gtn_unique` ON `inventories` (`gtn`);--> statement-breakpoint
CREATE INDEX `inventories_product_id_idx` ON `inventories` (`product_id`);--> statement-breakpoint
CREATE INDEX `inventories_invoice_id_idx` ON `inventories` (`invoice_id`);--> statement-breakpoint
CREATE TABLE `pricing_categories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`code` text(20) NOT NULL,
	`name` text(50) NOT NULL,
	`description` text(255),
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `pricing_categories_code_unique` ON `pricing_categories` (`code`);--> statement-breakpoint
CREATE UNIQUE INDEX `pricing_categories_name_unique` ON `pricing_categories` (`name`);--> statement-breakpoint
CREATE TABLE `pricing_category_products` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`pricing_category_id` integer NOT NULL,
	`product_id` integer NOT NULL,
	`margin_type` text(25) DEFAULT 'none' NOT NULL,
	`margin_pct` real DEFAULT 0 NOT NULL,
	`margin_amount` real DEFAULT 0 NOT NULL,
	FOREIGN KEY (`pricing_category_id`) REFERENCES `pricing_categories`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `pcp_pricing_category_id_idx` ON `pricing_category_products` (`pricing_category_id`);--> statement-breakpoint
CREATE INDEX `pcp_product_id_idx` ON `pricing_category_products` (`product_id`);--> statement-breakpoint
CREATE TABLE `product_attribute_values` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`product_id` integer NOT NULL,
	`attribute_id` integer NOT NULL,
	`value` text NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`attribute_id`) REFERENCES `attributes`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `product_attrv_product_attribute_id_unique` ON `product_attribute_values` (`product_id`,`attribute_id`);--> statement-breakpoint
CREATE INDEX `product_attrv_attribute_id_idx` ON `product_attribute_values` (`attribute_id`);--> statement-breakpoint
CREATE TABLE `product_bundles` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`bundle_product_id` integer NOT NULL,
	`product_id` integer NOT NULL,
	`quantity` integer DEFAULT 1 NOT NULL,
	FOREIGN KEY (`bundle_product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `product_bundles_bundle_product_id_product_id_unique` ON `product_bundles` (`bundle_product_id`,`product_id`);--> statement-breakpoint
CREATE INDEX `product_bundles_product_id_idx` ON `product_bundles` (`product_id`);--> statement-breakpoint
CREATE TABLE `product_serial_numbers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`product_id` integer NOT NULL,
	`prefix` text(50) DEFAULT '' NOT NULL,
	`current` integer DEFAULT 1 NOT NULL,
	`length` integer DEFAULT 10 NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `product_serial_numbers_product_id_unique` ON `product_serial_numbers` (`product_id`);--> statement-breakpoint
CREATE TABLE `product_template_attributes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`template_id` integer NOT NULL,
	`attribute_id` integer NOT NULL,
	`is_variant_defining` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`template_id`) REFERENCES `product_templates`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`attribute_id`) REFERENCES `attributes`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `product_template_attributes_template_id_attribute_id_unique` ON `product_template_attributes` (`template_id`,`attribute_id`);--> statement-breakpoint
CREATE INDEX `product_template_attributes_attribute_id_idx` ON `product_template_attributes` (`attribute_id`);--> statement-breakpoint
CREATE TABLE `product_templates` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text(50) NOT NULL,
	`description` text(255),
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `product_templates_name_unique` ON `product_templates` (`name`);--> statement-breakpoint
CREATE TABLE `products` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`code` text(20) NOT NULL,
	`name` text(50) NOT NULL,
	`description` text(255),
	`category_id` integer NOT NULL,
	`brand_id` integer,
	`product_type` text(25) DEFAULT 'simple' NOT NULL,
	`parent_id` integer,
	`template_id` integer,
	`qty_per_unit` text(25) DEFAULT '1' NOT NULL,
	`unit_price` real DEFAULT 0 NOT NULL,
	`hsn_sac` text(25) DEFAULT '' NOT NULL,
	`tax_rate` real DEFAULT 0 NOT NULL,
	`use_global` integer DEFAULT true NOT NULL,
	`track_bundle_gtn` integer DEFAULT true,
	`gtn_mode` text(25) DEFAULT 'global' NOT NULL,
	`gtn_generation` text(25) DEFAULT 'global' NOT NULL,
	`is_tax_inclusive` integer DEFAULT false NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`brand_id`) REFERENCES `brands`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`parent_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`template_id`) REFERENCES `product_templates`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `products_code_unique` ON `products` (`code`);--> statement-breakpoint
CREATE UNIQUE INDEX `products_name_unique` ON `products` (`name`);--> statement-breakpoint
CREATE INDEX `products_category_id_idx` ON `products` (`category_id`);--> statement-breakpoint
CREATE TABLE `purchase_invoice_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`purchase_invoice_id` integer NOT NULL,
	`inventory_id` integer NOT NULL,
	`qty` real DEFAULT 0 NOT NULL,
	`unit_price` real DEFAULT 0 NOT NULL,
	`discount_type` text(10) DEFAULT 'none' NOT NULL,
	`discount_pct` real DEFAULT 0 NOT NULL,
	`discount_amount` real DEFAULT 0 NOT NULL,
	`tax_pct` real DEFAULT 0 NOT NULL,
	`tax_amount` real GENERATED ALWAYS AS ((ROUND((qty * unit_price - discount_amount) * tax_pct / 100, 2))) VIRTUAL,
	`sgst_amount` real DEFAULT 0 NOT NULL,
	`cgst_amount` real DEFAULT 0 NOT NULL,
	`igst_amount` real DEFAULT 0 NOT NULL,
	`line_total` real GENERATED ALWAYS AS ((ROUND((qty * unit_price - discount_amount) + tax_amount, 2))) VIRTUAL,
	`margin_type` text(25) DEFAULT 'none' NOT NULL,
	`margin_pct` real DEFAULT 0 NOT NULL,
	`margin_amount` real DEFAULT 0 NOT NULL,
	`selling_price` real DEFAULT 0 NOT NULL,
	FOREIGN KEY (`purchase_invoice_id`) REFERENCES `purchase_invoices`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`inventory_id`) REFERENCES `inventories`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `purchase_invoice_items_purchase_invoice_id_idx` ON `purchase_invoice_items` (`purchase_invoice_id`);--> statement-breakpoint
CREATE INDEX `purchase_invoice_items_inventory_id_idx` ON `purchase_invoice_items` (`inventory_id`);--> statement-breakpoint
CREATE TABLE `purchase_invoices` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`invoice_number` text(25) NOT NULL,
	`invoice_date` text(25) NOT NULL,
	`supplier_id` integer NOT NULL,
	`ref_number` text(25),
	`ref_date` text(25),
	`total_qty` real DEFAULT 0 NOT NULL,
	`subtotal` real DEFAULT 0 NOT NULL,
	`discount_type` text(20) DEFAULT 'none' NOT NULL,
	`discount_pct` real DEFAULT 0 NOT NULL,
	`discount_amount` real DEFAULT 0 NOT NULL,
	`total_tax_amount` real DEFAULT 0 NOT NULL,
	`round_off` real DEFAULT 0 NOT NULL,
	`net_amount` real GENERATED ALWAYS AS ((ROUND(subtotal - discount_amount + total_tax_amount + round_off, 2))) VIRTUAL,
	FOREIGN KEY (`supplier_id`) REFERENCES `suppliers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `purchase_invoices_invoice_number_unique` ON `purchase_invoices` (`invoice_number`);--> statement-breakpoint
CREATE INDEX `purchase_invoices_supplier_id_idx` ON `purchase_invoices` (`supplier_id`);--> statement-breakpoint
CREATE INDEX `purchase_invoices_invoice_date_idx` ON `purchase_invoices` (`invoice_date`);--> statement-breakpoint
CREATE INDEX `purchase_invoices_ref_number_idx` ON `purchase_invoices` (`ref_number`);--> statement-breakpoint
CREATE TABLE `refresh_tokens` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`token_hash` text(64) NOT NULL,
	`expires_at` integer NOT NULL,
	`revoked_at` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `refresh_tokens_token_hash_unique` ON `refresh_tokens` (`token_hash`);--> statement-breakpoint
CREATE INDEX `refresh_tokesn_user_id_idx` ON `refresh_tokens` (`user_id`);--> statement-breakpoint
CREATE TABLE `sales_invoice_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`sales_invoice_id` integer NOT NULL,
	`inventory_id` integer NOT NULL,
	`qty` real DEFAULT 0 NOT NULL,
	`unit_price` real DEFAULT 0 NOT NULL,
	`discount_type` text(10) DEFAULT 'none' NOT NULL,
	`discount_pct` real DEFAULT 0 NOT NULL,
	`discount_amount` real DEFAULT 0 NOT NULL,
	`tax_pct` real DEFAULT 0 NOT NULL,
	`tax_amount` real GENERATED ALWAYS AS ((ROUND((qty * unit_price - discount_amount) * tax_pct / 100, 2))) VIRTUAL,
	`sgst_amount` real DEFAULT 0 NOT NULL,
	`cgst_amount` real DEFAULT 0 NOT NULL,
	`igst_amount` real DEFAULT 0 NOT NULL,
	`line_total` real GENERATED ALWAYS AS ((ROUND((qty * unit_price - discount_amount) + tax_amount, 2))) VIRTUAL,
	FOREIGN KEY (`sales_invoice_id`) REFERENCES `sales_invoices`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`inventory_id`) REFERENCES `inventories`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `sales_invoice_items_sales_invoice_id_idx` ON `sales_invoice_items` (`sales_invoice_id`);--> statement-breakpoint
CREATE INDEX `sales_invoice_items_inventory_id_idx` ON `sales_invoice_items` (`inventory_id`);--> statement-breakpoint
CREATE TABLE `sales_invoices` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`invoice_number` text(25) NOT NULL,
	`invoice_date` text(25) NOT NULL,
	`type` text(20) DEFAULT 'invoice' NOT NULL,
	`customer_id` integer NOT NULL,
	`ref_number` text(25),
	`ref_date` text(25),
	`is_tax_inclusive` integer,
	`total_qty` real DEFAULT 0 NOT NULL,
	`subtotal` real DEFAULT 0 NOT NULL,
	`discount_type` text(20) DEFAULT 'none' NOT NULL,
	`discount_pct` real DEFAULT 0 NOT NULL,
	`discount_amount` real DEFAULT 0 NOT NULL,
	`total_tax_amount` real DEFAULT 0 NOT NULL,
	`round_off` real DEFAULT 0 NOT NULL,
	`net_amount` real GENERATED ALWAYS AS ((ROUND(subtotal - discount_amount + total_tax_amount + round_off, 2))) VIRTUAL,
	`irn` text(64),
	`ack_no` text(20),
	`ack_date` text(50),
	`signed_qr_code` text,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sales_invoices_invoice_number_unique` ON `sales_invoices` (`invoice_number`);--> statement-breakpoint
CREATE INDEX `sales_invoices_invoice_date_idx` ON `sales_invoices` (`invoice_date`);--> statement-breakpoint
CREATE INDEX `sales_invoices_customer_id_idx` ON `sales_invoices` (`customer_id`);--> statement-breakpoint
CREATE INDEX `sales_invoices_ref_number_idx` ON `sales_invoices` (`ref_number`);--> statement-breakpoint
CREATE INDEX `sales_invoices_irn_idx` ON `sales_invoices` (`irn`);--> statement-breakpoint
CREATE INDEX `sales_invoices_ack_no_idx` ON `sales_invoices` (`ack_no`);--> statement-breakpoint
CREATE TABLE `serial_numbers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`key` text(25) NOT NULL,
	`prefix` text(10) DEFAULT '' NOT NULL,
	`current` integer DEFAULT 1 NOT NULL,
	`length` integer DEFAULT 10 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `serial_numbers_key_unique` ON `serial_numbers` (`key`);--> statement-breakpoint
CREATE TABLE `settings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`key` text(50) NOT NULL,
	`value` text(255) DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `settings_key_unique` ON `settings` (`key`);--> statement-breakpoint
CREATE TABLE `states` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`state_name` text(100) NOT NULL,
	`state_code` text(2) NOT NULL,
	`state_short_code` text(5) NOT NULL,
	`country_code` text(2) DEFAULT 'IN' NOT NULL,
	`is_union_territory` integer DEFAULT false,
	`is_active` integer DEFAULT true
);
--> statement-breakpoint
CREATE UNIQUE INDEX `states_state_name` ON `states` (`state_name`);--> statement-breakpoint
CREATE UNIQUE INDEX `states_state_code` ON `states` (`state_code`);--> statement-breakpoint
CREATE UNIQUE INDEX `states_state_short_code` ON `states` (`state_short_code`);--> statement-breakpoint
CREATE TABLE `stock_invoice_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`stock_invoice_id` integer NOT NULL,
	`inventory_id` integer NOT NULL,
	`qty` real DEFAULT 1 NOT NULL,
	`unit_price` real DEFAULT 0 NOT NULL,
	`line_total` real GENERATED ALWAYS AS ((ROUND(qty * unit_price, 2))) VIRTUAL,
	`margin_type` text(25) DEFAULT 'none' NOT NULL,
	`margin_pct` real DEFAULT 0 NOT NULL,
	`margin_amount` real DEFAULT 0 NOT NULL,
	`selling_price` real DEFAULT 0 NOT NULL,
	FOREIGN KEY (`stock_invoice_id`) REFERENCES `stock_invoices`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`inventory_id`) REFERENCES `inventories`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `stock_invoice_items_stock_invoice_id_idx` ON `stock_invoice_items` (`stock_invoice_id`);--> statement-breakpoint
CREATE INDEX `stock_invoice_items_inventory_id_idx` ON `stock_invoice_items` (`inventory_id`);--> statement-breakpoint
CREATE TABLE `stock_invoices` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`invoice_number` text(20) NOT NULL,
	`invoice_date` text(20) NOT NULL,
	`total_qty` real DEFAULT 0 NOT NULL,
	`total_amount` real DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `stock_invoices_invoice_number_unique` ON `stock_invoices` (`invoice_number`);--> statement-breakpoint
CREATE INDEX `stock_invoices_invoice_date_idx` ON `stock_invoices` (`invoice_date`);--> statement-breakpoint
CREATE TABLE `supplier_banks` (
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
CREATE INDEX `supplier_bank_supplier_id_idx` ON `supplier_banks` (`supplier_id`);--> statement-breakpoint
CREATE TABLE `suppliers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`code` text(20) NOT NULL,
	`name` text(50) NOT NULL,
	`type` text DEFAULT 'supplier' NOT NULL,
	`gstin` text(25),
	`billing_address_id` integer,
	`shipping_address_id` integer,
	`notes` text(255),
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`billing_address_id`) REFERENCES `addresses`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`shipping_address_id`) REFERENCES `addresses`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `suppliers_code_unique` ON `suppliers` (`code`);--> statement-breakpoint
CREATE UNIQUE INDEX `suppliers_name_unique` ON `suppliers` (`name`);--> statement-breakpoint
CREATE INDEX `suppliers_billing_address_id_idx` ON `suppliers` (`billing_address_id`);--> statement-breakpoint
CREATE INDEX `suppliers_shipping_address_id_idx` ON `suppliers` (`shipping_address_id`);--> statement-breakpoint
CREATE INDEX `suppliers_gstin_idx` ON `suppliers` (`gstin`);--> statement-breakpoint
CREATE TABLE `tax_rates` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`code` text NOT NULL,
	`rate` integer NOT NULL,
	`cgst_rate` integer NOT NULL,
	`sgst_rate` integer NOT NULL,
	`igst_rate` integer NOT NULL,
	`cess_rate` integer NOT NULL,
	`cess_amount` integer NOT NULL,
	`is_exempt` integer DEFAULT false NOT NULL,
	`is_nil_rated` integer DEFAULT false NOT NULL,
	`reverse_charge` integer DEFAULT false NOT NULL,
	`effective_from` text NOT NULL,
	`effective_to` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tax_rates_code_unique` ON `tax_rates` (`code`);--> statement-breakpoint
CREATE UNIQUE INDEX `tax_rates_rate_effective_from_unique` ON `tax_rates` (`rate`,`effective_from`);--> statement-breakpoint
CREATE TABLE `tax_rule_conditions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`tax_rule_id` integer NOT NULL,
	`field` text NOT NULL,
	`operator` text NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `tax_rule_groups` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`priority` integer DEFAULT 0 NOT NULL,
	`description` text
);
--> statement-breakpoint
CREATE TABLE `tax_rules` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`rule_group_id` integer NOT NULL,
	`tax_rate_id` integer NOT NULL,
	`hsn_code_starts_with` text(20),
	`min_price` integer DEFAULT 0 NOT NULL,
	`max_price` integer DEFAULT 0 NOT NULL,
	`is_inter_state` integer DEFAULT false NOT NULL,
	`is_intra_state` integer DEFAULT true NOT NULL,
	`customer_type` text DEFAULT 'retail' NOT NULL,
	`priority` integer DEFAULT 0 NOT NULL,
	`effective_from` text NOT NULL,
	`effective_to` text
);
--> statement-breakpoint
CREATE INDEX `tax_rules_hsn_code_effective_from_unique` ON `tax_rules` (`hsn_code_starts_with`,`effective_from`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`username` text(20) NOT NULL,
	`password_hash` text(255) NOT NULL,
	`first_name` text(50),
	`last_name` text(50),
	`role` text(20) DEFAULT 'user' NOT NULL,
	`permissions` text DEFAULT '{}',
	`must_change_password` integer DEFAULT true NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	CONSTRAINT "role_must_be_in_list" CHECK("users"."role" IN ('user', 'salesperson', 'manager', 'admin'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);--> statement-breakpoint
CREATE TABLE `inventory_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`product_id` integer NOT NULL,
	`gtn` text(25) DEFAULT '' NOT NULL,
	`change_qty` real DEFAULT 0 NOT NULL,
	`direction` text(10) NOT NULL,
	`type` text(25) NOT NULL,
	`ref_id` integer NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `inventory_logs_product_id_idx` ON `inventory_logs` (`product_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `inventory_logs_gtn_idx` ON `inventory_logs` (`gtn`);