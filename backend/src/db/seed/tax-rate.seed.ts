import { db, TaxRate, taxRates } from "../../db";

export const seedTaxRates = async () => {
    const existing = await db.select().from(taxRates).limit(1).all();
    if (existing.length > 0) return;

    const initialTaxRates: Omit<TaxRate, 'id'>[] = [
        { code: 'GST0', rate: 0, cgstRate: 0, sgstRate: 0, igstRate: 0, cessRate: 0, cessAmount: 0, effectiveFrom: '2020-04-01', isExempt: false, isNilRated: false, reverseCharge: false, effectiveTo: null },
        { code: 'GST5', rate: 5, cgstRate: 2.5, sgstRate: 2.5, igstRate: 5, cessRate: 0, cessAmount: 0, effectiveFrom: '2020-04-01', isExempt: false, isNilRated: false, reverseCharge: false, effectiveTo: null },
        { code: 'GST12', rate: 12, cgstRate: 6, sgstRate: 6, igstRate: 12, cessRate: 0, cessAmount: 0, effectiveFrom: '2020-04-01', isExempt: false, isNilRated: false, reverseCharge: false, effectiveTo: null },
        { code: 'GST18', rate: 18, cgstRate: 9, sgstRate: 9, igstRate: 18, cessRate: 0, cessAmount: 0, effectiveFrom: '2020-04-01', isExempt: false, isNilRated: false, reverseCharge: false, effectiveTo: null },
        { code: 'GST28', rate: 28, cgstRate: 14, sgstRate: 14, igstRate: 28, cessRate: 0, cessAmount: 0, effectiveFrom: '2020-04-01', isExempt: false, isNilRated: false, reverseCharge: false, effectiveTo: null },
    ];

    for (const taxRate of initialTaxRates) {
        await db.insert(taxRates).values(taxRate).run();
    }
};
