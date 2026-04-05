export interface TaxRate {
    id: number;
    code: string;
    rate: number;
    cgstRate: number;
    sgstRate: number;
    igstRate: number;
    cessRate: number;
    cessAmount: number;
    isExempt: boolean;
    isNilRated: boolean;
    reverseCharge: boolean;
    effectiveFrom: string;
    effectiveTo?: string | null;
}

export interface TaxRuleGroup {
    id: number;
    name: string;
    priority: number;
    description?: string | null;
}

export interface TaxRuleCondition {
    id: number;
    taxRuleId: number;
    field: string;
    operator: string;
    value: string;
}

export interface TaxRule {
    id: number;
    ruleGroupId: number;
    taxRateId: number;
    hsnCodeStartsWith?: string | null;
    minPrice: number;
    maxPrice: number;
    isInterState: boolean;
    isIntraState: boolean;
    customerType: string;
    priority: number;
    effectiveFrom: string;
    effectiveTo?: string | null;
    
    // Virtual fields or included relations
    groupName?: string;
    taxRateRate?: number;
    conditions?: TaxRuleCondition[];
}

export interface RuleEvaluationInput {
    hsnCode?: string;
    unitPrice: number;
    isInterState: boolean;
    customerType: string;
    date?: string;
}
