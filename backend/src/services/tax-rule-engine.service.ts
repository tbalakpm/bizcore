import { eq, and, or, lte, gte, isNull, sql, asc, desc } from 'drizzle-orm';
import { db, taxRules, taxRates, taxRuleGroups, taxRuleConditions, TaxRate, TaxRule, TaxRuleGroup } from '../db';
import { LogService } from '../core/logger/logger.service';

export interface RuleEngineInput {
    hsnCode?: string;
    unitPrice: number;
    isInterState: boolean;
    customerType: string; // retail, b2b, export
    date?: string; // ISO date string, defaults to today
    [key: string]: any;
}

export class TaxRuleEngineService {
    /**
     * Evaluates GST rules and returns the applicable tax rate.
     */
    async evaluate(input: RuleEngineInput): Promise<TaxRate | null> {
        const { hsnCode = '', unitPrice, isInterState, customerType, date = new Date().toISOString().split('T')[0] } = input;

        try {
            // 1. Fetch all Rule Groups sorted by priority
            const groups = await db.select().from(taxRuleGroups).orderBy(desc(taxRuleGroups.priority)).all();

            for (const group of groups) {
                // 2. Fetch Rules in this group that match basic criteria
                // We'll filter more precisely in memory or via SQL
                const rules = await db.select()
                    .from(taxRules)
                    .where(and(
                        eq(taxRules.ruleGroupId, group.id),
                        lte(taxRules.effectiveFrom, date),
                        or(isNull(taxRules.effectiveTo), gte(taxRules.effectiveTo, date)),
                        // Basic price check
                        lte(taxRules.minPrice, unitPrice),
                        or(eq(taxRules.maxPrice, 0), gte(taxRules.maxPrice, unitPrice)),
                        // State check
                        isInterState ? eq(taxRules.isInterState, true) : eq(taxRules.isIntraState, true),
                        // Customer type check
                        eq(taxRules.customerType, customerType)
                    ))
                    .orderBy(desc(taxRules.priority))
                    .all();

                // 3. Filter by HSN and Dynamic Conditions
                const matchedRule = await this.findBestMatchedRule(rules, hsnCode, unitPrice);

                if (matchedRule) {
                    // 4. Fetch the Tax Rate associated with the matched rule
                    const rate = await db.select().from(taxRates).where(eq(taxRates.id, matchedRule.taxRateId)).get();
                    if (rate) {
                        LogService.info('Tax rule matched', { ruleId: matchedRule.id, rateId: rate.id, rate: rate.rate });
                        return rate;
                    }
                }
            }

            LogService.info('No tax rule matched for input', input);
            return null;
        } catch (error) {
            LogService.error('Error in TaxRuleEngine evaluation', error);
            return null;
        }
    }

    private async findBestMatchedRule(rules: TaxRule[], hsnCode: string, unitPrice: number): Promise<TaxRule | null> {
        // Rules are already sorted by priority. 
        // We further need to check HSN prefix matches and dynamic conditions.
        
        let bestMatch: TaxRule | null = null;
        let maxPrefixLength = -1;

        for (const rule of rules) {
            const ruleHsn = rule.hsnCodeStartsWith || '';
            
            // Check HSN Prefix
            if (hsnCode.startsWith(ruleHsn)) {
                // Check Dynamic Conditions if any
                const conditionsMatch = await this.checkDynamicConditions(rule.id, hsnCode, unitPrice);
                
                if (conditionsMatch) {
                    // In Drizzle, we trust the priority from the query, but if HSN prefix is longer, it's more specific.
                    // If priorities are same, longer prefix wins.
                    if (ruleHsn.length > maxPrefixLength) {
                        maxPrefixLength = ruleHsn.length;
                        bestMatch = rule;
                    }
                }
            }
        }

        return bestMatch;
    }

    private async checkDynamicConditions(ruleId: number, hsnCode: string, unitPrice: number): Promise<boolean> {
        const conditions = await db.select().from(taxRuleConditions).where(eq(taxRuleConditions.taxRuleId, ruleId)).all();
        if (conditions.length === 0) return true;

        for (const cond of conditions) {
            const fieldValue = cond.field === 'hsn' ? hsnCode : cond.field === 'price' ? unitPrice : null;
            if (fieldValue === null) continue;

            const isMatch = this.evaluateCondition(fieldValue, cond.operator, cond.value);
            if (!isMatch) return false;
        }

        return true;
    }

    private evaluateCondition(fieldValue: any, operator: string, condValue: string): boolean {
        const val = isNaN(Number(condValue)) ? condValue : Number(condValue);
        const fVal = typeof val === 'number' ? Number(fieldValue) : String(fieldValue);

        switch (operator.toUpperCase()) {
            case '=':
            case '==':
            case 'EQUALS':
                return fVal == val;
            case '>':
            case 'GT':
                return fVal > val;
            case '<':
            case 'LT':
                return fVal < val;
            case '>=':
                return fVal >= val;
            case '<=':
                return Number(fVal) <= Number(val);
            case 'LIKE':
                // Simple LIKE implementation: % as wildcard
                const regex = new RegExp('^' + condValue.replace(/%/g, '.*') + '$', 'i');
                return regex.test(String(fVal));
            case 'IN':
                const list = condValue.split(',').map(s => s.trim());
                return list.includes(String(fVal));
            default:
                return false;
        }
    }
}

export const taxRuleEngine = new TaxRuleEngineService();
