# GST rule engine (Production Ready)

## Overview

This document describes a scalable GST tax engine design with: -
tax_rates - tax_rule_groups - tax_rules - tax_rule_conditions

---

## 1. tax_rates

- Stores GST rates and flags
- Supports effective dates

Key fields: - code - rate - cgstRate, sgstRate, igstRate - cessRate,
cessAmount - isExempt, isNilRated, reverseCharge - effectiveFrom,
effectiveTo

## Drizzle Schema

```typescript
import {
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const taxRates = sqliteTable(
  "tax_rates",
  {
    id: integer("id").primaryKey({ autoIncrement: true }).notNull(),

    code: text("code", { length: 50 }) // e.g. GST_18, GST_5_LUXURY
      .notNull(),

    rate: integer("rate").notNull(), // 18, 5, etc.

    cgstRate: integer("cgst_rate").notNull(),
    sgstRate: integer("sgst_rate").notNull(),
    igstRate: integer("igst_rate").notNull(),

    cessRate: integer("cess_rate").default(0).notNull(),
    cessAmount: integer("cess_amount").default(0).notNull(),

    isExempt: integer("is_exempt", { mode: "boolean" }).default(false),
    isNilRated: integer("is_nil_rated", { mode: "boolean" }).default(false),

    reverseCharge: integer("reverse_charge", { mode: "boolean" }).default(
      false,
    ),

    effectiveFrom: text("effective_from").notNull(),
    effectiveTo: text("effective_to"),

    status: text("status").default("ACTIVE"),

    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => [
    uniqueIndex("tax_rates_code_effective_unique").on(t.code, t.effectiveFrom),
  ],
);
```

---

## 2. tax_rule_groups

- Logical grouping of rules
- Supports prioritization

Key fields: - name - priority - description

## Drizzle Schema

```typescript
import {
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const taxRuleGroups = sqliteTable("tax_rule_groups", {
  id: integer("id").primaryKey({ autoIncrement: true }).notNull(),

  name: text("name").notNull(), // e.g. TEXTILES, ELECTRONICS

  priority: integer("priority").default(1).notNull(),

  description: text("description"),

  status: text("status").default("ACTIVE"),

  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});
```

---

## 3. tax_rules

- Maps conditions to tax rates

Key fields: - ruleGroupId - taxRateId (FK) - hsnCodeStartsWith -
minPrice, maxPrice - isInterState, isIntraState - customerType
(B2B/B2C/EXPORT) - priority - effectiveFrom, effectiveTo

## Drizzle Schema

```typescript
export const taxRules = sqliteTable(
  "tax_rules",
  {
    id: integer("id").primaryKey({ autoIncrement: true }).notNull(),

    ruleGroupId: integer("rule_group_id").references(() => taxRuleGroups.id),

    taxRateId: integer("tax_rate_id")
      .notNull()
      .references(() => taxRates.id),

    hsnCodeStartsWith: text("hsn_code_starts_with", { length: 20 }),

    minPrice: integer("min_price"),
    maxPrice: integer("max_price"),

    isInterState: integer("is_inter_state", { mode: "boolean" }),
    isIntraState: integer("is_intra_state", { mode: "boolean" }),

    customerType: text("customer_type"),
    // B2B / B2C / EXPORT

    compositionScheme: integer("composition_scheme", { mode: "boolean" }),

    priority: integer("priority").default(1).notNull(),

    effectiveFrom: text("effective_from").notNull(),
    effectiveTo: text("effective_to"),

    status: text("status").default("ACTIVE"),

    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => [
    index("tax_rules_lookup").on(
      t.hsnCodeStartsWith,
      t.effectiveFrom,
      t.priority,
    ),
  ],
);
```

---

## 4. tax_rule_conditions

- Dynamic rule engine

Fields: - taxRuleId - field - operator - value

Example: - hsn LIKE '6201%' - price \> 1000

```json
[
  { "field": "hsn", "operator": "LIKE", "value": "6201%" },
  { "field": "price", "operator": ">", "value": "1000" }
]
```

## Drizzle Scheam

```typescript
export const taxRuleConditions = sqliteTable("tax_rule_conditions", {
  id: integer("id").primaryKey({ autoIncrement: true }).notNull(),

  taxRuleId: integer("tax_rule_id")
    .notNull()
    .references(() => taxRules.id),

  field: text("field").notNull(),
  // 'hsn', 'price', 'state', etc.

  operator: text("operator").notNull(),
  // '=', '>', '<', 'LIKE'

  value: text("value").notNull(),
});
```

---

## Flow

Product → HSN → tax_rules → priority → tax_rate → apply GST

---

## Best Practices

- Always snapshot tax in invoice_items
- Never rely on live rules for old invoices
- Use priority to resolve conflicts

---

## Notes

This design is scalable and similar to enterprise systems like
Tally/Zoho.

```

```
