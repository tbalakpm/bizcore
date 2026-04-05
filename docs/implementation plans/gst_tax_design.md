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

---

## 2. tax_rule_groups

- Logical grouping of rules
- Supports prioritization

Key fields: - name - priority - description

---

## 3. tax_rules

- Maps conditions to tax rates

Key fields: - ruleGroupId - taxRateId (FK) - hsnCodeStartsWith -
minPrice, maxPrice - isInterState, isIntraState - customerType
(B2B/B2C/EXPORT) - priority - effectiveFrom, effectiveTo

---

## 4. tax_rule_conditions

- Dynamic rule engine

Fields: - taxRuleId - field - operator - value

Example: - hsn LIKE '6201%' - price \> 1000

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
