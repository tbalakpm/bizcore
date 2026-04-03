# GST Handling & State Master Design (Inventory System)

## 1. GST Basics

-   GST Types:
    -   CGST + SGST (intra-state)
    -   IGST (inter-state)
-   Determined by **Place of Supply**

------------------------------------------------------------------------

## 2. Inclusive vs Exclusive Pricing

### Exclusive

Selling Price = Base + GST

### Inclusive

Base = Price / (1 + GST%) GST = Price - Base

**Recommendation:** - Always store **base price + tax rate** - Derive
totals dynamically

------------------------------------------------------------------------

## 3. Invoice Price Mode

Field:

    price_mode ENUM('INCLUSIVE', 'EXCLUSIVE')

Priority: 1. Invoice 2. Product 3. System default

------------------------------------------------------------------------

## 4. Place of Supply Rule

For GOODS: - Use **Shipping Address State**

For SERVICES: - Use **Billing Address**

------------------------------------------------------------------------

## 5. Tax Logic

    isInterState = company.state != shipping.state

-   Same → CGST + SGST
-   Different → IGST

------------------------------------------------------------------------

## 6. State Master Table

    states
    --------
    id
    state_name
    state_code (GST code)
    state_short_code
    country_code
    is_union_territory
    is_active

Example: - Tamil Nadu → 33 - Karnataka → 29

------------------------------------------------------------------------

## 7. Usage

    billing_state_id
    shipping_state_id
    place_of_supply_state_id

------------------------------------------------------------------------

## 8. GSTIN Validation

-   First 2 digits = state code
-   Match with state master

------------------------------------------------------------------------

## 9. Best Practices

-   Do NOT store state as text
-   Always use FK
-   Cache state code in invoice
-   Do not mix inclusive/exclusive in same invoice

------------------------------------------------------------------------

## 10. Advanced

-   Tax rules table (HSN + price slab)
-   Support SEZ, Export, RCM
-   Decimal-safe calculations

------------------------------------------------------------------------

## Conclusion

A robust GST system requires: - Rule-based tax engine - Invoice-level
price mode - State master with GST codes - Proper place of supply
handling
