import { sqliteTable, integer, text, index, } from "drizzle-orm/sqlite-core";
import { suppliers } from "./supplier.schema";

export const supplierBanks = sqliteTable("supplier_banks", {
    id: integer("id").primaryKey({ autoIncrement: true }).notNull(),
    supplierId: integer("supplier_id")
        .notNull()
        .references(() => suppliers.id),
    bankName: text("bank_name").notNull(),
    accountNumber: text("account_number").notNull(),
    ifscCode: text("ifsc_code").notNull(),
    branchName: text("branch_name").notNull(),
    isPrimary: integer("is_primary", { mode: 'boolean' }).notNull().default(false),
}, (t) => [
    index('supplier_bank_supplier_id_idx').on(t.supplierId),
]);

// export const supplierBankRelations = relations(supplierBank, ({ one }) => ({
//     supplier: one(suppliers, {
//         fields: [supplierBank.supplierId],
//         references: [suppliers.id],
//     }),
// }));

export type SupplierBank = typeof supplierBanks.$inferSelect;
export type NewSupplierBank = typeof supplierBanks.$inferInsert;
