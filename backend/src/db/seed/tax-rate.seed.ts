import { db, taxRates } from "../../db";

export const seedTaxRates = async () => {
    const existing = await db.select().from(taxRates).limit(1).all();
    if (existing.length > 0) return;

    const initialTaxRates = [
        { rate: 0, cgst_rate: 0, sgst_rate: 0, igst_rate: 0, cess_rate: 0, cess_amount: 0, effective_from: '2020-04-01' },
        { rate: 5, cgst_rate: 2.5, sgst_rate: 2.5, igst_rate: 5, cess_rate: 0, cess_amount: 0, effective_from: '2020-04-01' },
        { rate: 12, cgst_rate: 6, sgst_rate: 6, igst_rate: 12, cess_rate: 0, cess_amount: 0, effective_from: '2020-04-01' },
        { rate: 18, cgst_rate: 9, sgst_rate: 9, igst_rate: 18, cess_rate: 0, cess_amount: 0, effective_from: '2020-04-01' },
        { rate: 28, cgst_rate: 14, sgst_rate: 14, igst_rate: 28, cess_rate: 0, cess_amount: 0, effective_from: '2020-04-01' },
    ];

    for (const taxRate of initialTaxRates) {
        await db.insert(taxRates).values(taxRate).run();
    }
};
