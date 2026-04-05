# Revamp GST Taxation and Build Reusable Rule Engine

This plan describes the complete overhaul of the GST taxation system, moving from a hardcoded/simple logic to a dynamic, priority-indexed rule engine.

## User Review Required

> [!IMPORTANT]
> - **Breaking Changes**: This will replace the existing `tax_rules` and `tax_rates` tables. Existing data might be lost or needs migration.
> - **Schema Design**: The new design uses `tax_rule_groups` and `tax_rule_conditions` for maximum flexibility.
> - **Invoice Calculation**: The way taxes are calculated in the Sales/Purchase invoices will be updated to call the new Rule Engine.

## Proposed Changes

### 1. Database Layer (Backend)

#### [MODIFY] [tax-rate.schema.ts](file:///Users/tbalamurugan/Projects/fanda-org/bizcore/backend/src/db/schema/tax-rate.schema.ts)
- Add `code` (string, unique), `isExempt` (boolean, default false), `isNilRated` (boolean, default false), `reverseCharge` (boolean, default false), `effectiveTo` (text).

#### [NEW] [tax-rule-group.schema.ts](file:///Users/tbalamurugan/Projects/fanda-org/bizcore/backend/src/db/schema/tax-rule-group.schema.ts)
- Create `tax_rule_groups` table with `name`, `priority`, `description`.

#### [MODIFY] [tax-rule.schema.ts](file:///Users/tbalamurugan/Projects/fanda-org/bizcore/backend/src/db/schema/tax-rule.schema.ts)
- Add `ruleGroupId` (integer, FK to tax_rule_groups), `taxRateId` (integer, FK to tax_rates), `isInterState` (boolean, default false), `isIntraState` (boolean, default true), `customerType` (text, default 'retail'), `priority` (integer, default 0), `effectiveTo` (text).

#### [NEW] [tax-rule-condition.schema.ts](file:///Users/tbalamurugan/Projects/fanda-org/bizcore/backend/src/db/schema/tax-rule-condition.schema.ts)
- Create `tax_rule_conditions` table with `taxRuleId` (integer, FK to tax_rules), `field` (text), `operator` (text), `value` (text).

#### [MODIFY] [index.ts](file:///Users/tbalamurugan/Projects/fanda-org/bizcore/backend/src/db/schema/index.ts)
- Export new tables and types.

---

### 2. Rule Engine Service (Backend)

#### [NEW] [tax-rule-engine.service.ts](file:///Users/tbalamurugan/Projects/fanda-org/bizcore/backend/src/services/tax-rule-engine.service.ts)
- Implement `TaxRuleEngine.evaluate(input: RuleEngineInput): Promise<TaxRate | null>` logic.
- Consider priority of groups and rules, effective dates, and dynamic conditions.

---

### 3. Backend Routes (Backend)

#### [MODIFY] [tax-rates.ts](file:///Users/tbalamurugan/Projects/fanda-org/bizcore/backend/src/routes/tax-rates.ts)
- Update CRUD logic to support new fields.

#### [MODIFY] [tax-rules.ts](file:///Users/tbalamurugan/Projects/fanda-org/bizcore/backend/src/routes/tax-rules.ts)
- Update CRUD logic to support new fields and related conditions.

#### [NEW] [tax-rule-groups.ts](file:///Users/tbalamurugan/Projects/fanda-org/bizcore/backend/src/routes/tax-rule-groups.ts)
- Create CRUD logic for rule groups.

---

### 4. Frontend Layer

#### [NEW] [Tax models and services](file:///Users/tbalamurugan/Projects/fanda-org/bizcore/frontend/src/app/settings/tax/tax-rule.model.ts)
- Update frontend interfaces for Rates, Rules, Rule Groups.

#### [NEW] [GST Rule Management Component](file:///Users/tbalamurugan/Projects/fanda-org/bizcore/frontend/src/app/settings/tax/gst-rule-management/)
- Build a new management UI for the rule engine.
- Tabbed interface (Groups, Rules, Rates).
- Support for "Test Engine" where user can input parameters and see which rules apply.

---

### 5. Integration

#### [MODIFY] [SalesInvoiceForm](file:///Users/tbalamurugan/Projects/fanda-org/bizcore/frontend/src/app/sales-invoice/sales-invoice-form.ts)
- Refactor `getEffectiveTaxRate` to use the new Engine logic.
- Ensure consistent snapshots of tax amounts.

## Open Questions

> [!IMPORTANT]
> - Should I clear existing tax rules or attempt to migrate them to the new schema?
> - How complex should the dynamic rule conditions be? (e.g., standard operators like `=`, `>`, `<`, `LIKE`, `IN`).

## Verification Plan

### Automated Tests
- `npm run test` (if applicable).
- Integration test for Rule Engine with various scenarios (HSN match, price range, inter-state/intra-state).

### Manual Verification
- Verify that a product with HSN `62` and price `> 1000` gets a different tax rate than HSN `62` and price `<= 1000`.
- Verify that inter-state sales correctly apply IGST from the rule engine.
- Verify managing rule groups and rules in the new UI.
