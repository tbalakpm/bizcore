import { eq, sql, gte, desc } from 'drizzle-orm';
import express, { type Request, type Response } from 'express';
import {
  db,
  customers,
  suppliers,
  products,
  salesInvoices,
  purchaseInvoices,
  inventories,
  salesInvoiceItems,
} from '../db';
import { LogService } from '../core/logger/logger.service';

export const dashboardRouter = express.Router();

dashboardRouter.get('/summary', async (req: Request, res: Response) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    const weekStr = startOfWeek.toISOString().split('T')[0];

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthStr = startOfMonth.toISOString().split('T')[0];

    const startOfYear = new Date(today.getFullYear(), 0, 1);
    const yearStr = startOfYear.toISOString().split('T')[0];

    // 1. Masters Summary
    const [customersCount] = await db
      .select({
        total: sql<number>`cast(count(*) as integer)`,
        active: sql<number>`cast(sum(case when ${customers.isActive} = 1 then 1 else 0 end) as integer)`,
      })
      .from(customers);

    const [suppliersCount] = await db
      .select({
        total: sql<number>`cast(count(*) as integer)`,
        active: sql<number>`cast(sum(case when ${suppliers.isActive} = 1 then 1 else 0 end) as integer)`,
      })
      .from(suppliers);

    const [productsCount] = await db
      .select({
        total: sql<number>`cast(count(*) as integer)`,
        active: sql<number>`cast(sum(case when ${products.isActive} = 1 then 1 else 0 end) as integer)`,
      })
      .from(products);

    // 2. Sales Summary
    const salesSummaryQuery = await db
      .select({
        period: sql<string>`
          case 
            when ${salesInvoices.invoiceDate} >= ${todayStr} then 'today'
            when ${salesInvoices.invoiceDate} >= ${weekStr} then 'week'
            when ${salesInvoices.invoiceDate} >= ${monthStr} then 'month'
            when ${salesInvoices.invoiceDate} >= ${yearStr} then 'year'
          end
        `,
        count: sql<number>`cast(count(*) as integer)`,
        total: sql<number>`cast(sum(${salesInvoices.netAmount}) as real)`,
        profit: sql<number>`cast(sum(${salesInvoices.netAmount} - ${salesInvoices.subtotal}) as real)`,
      })
      .from(salesInvoices)
      .where(gte(salesInvoices.invoiceDate, yearStr))
      .groupBy(sql`
        case 
          when ${salesInvoices.invoiceDate} >= ${todayStr} then 'today'
          when ${salesInvoices.invoiceDate} >= ${weekStr} then 'week'
          when ${salesInvoices.invoiceDate} >= ${monthStr} then 'month'
          when ${salesInvoices.invoiceDate} >= ${yearStr} then 'year'
        end
      `);

    // 3. Purchases Summary
    const purchaseSummaryQuery = await db
      .select({
        period: sql<string>`
          case 
            when ${purchaseInvoices.invoiceDate} >= ${todayStr} then 'today'
            when ${purchaseInvoices.invoiceDate} >= ${weekStr} then 'week'
            when ${purchaseInvoices.invoiceDate} >= ${monthStr} then 'month'
            when ${purchaseInvoices.invoiceDate} >= ${yearStr} then 'year'
          end
        `,
        count: sql<number>`cast(count(*) as integer)`,
        total: sql<number>`cast(sum(${purchaseInvoices.netAmount}) as real)`,
        tax: sql<number>`cast(sum(${purchaseInvoices.totalTaxAmount}) as real)`,
      })
      .from(purchaseInvoices)
      .where(gte(purchaseInvoices.invoiceDate, yearStr))
      .groupBy(sql`
        case 
          when ${purchaseInvoices.invoiceDate} >= ${todayStr} then 'today'
          when ${purchaseInvoices.invoiceDate} >= ${weekStr} then 'week'
          when ${purchaseInvoices.invoiceDate} >= ${monthStr} then 'month'
          when ${purchaseInvoices.invoiceDate} >= ${yearStr} then 'year'
        end
      `);

    // 4. Stock Summary
    const [stockSummary] = await db
      .select({
        qty: sql<number>`cast(sum(${inventories.unitsInStock}) as real)`,
        cost: sql<number>`cast(sum(${inventories.unitsInStock} * ${inventories.buyingPrice}) as real)`,
      })
      .from(inventories);

    // 5. Top 10 Lists
    const topProductsAmount = sql<number>`cast(sum(${salesInvoiceItems.lineTotal}) as real)`;
    const topProducts = await db
      .select({
        name: products.name,
        amount: topProductsAmount,
      })
      .from(salesInvoiceItems)
      .innerJoin(inventories, eq(inventories.id, salesInvoiceItems.inventoryId))
      .innerJoin(products, eq(products.id, inventories.productId))
      .groupBy(products.id)
      .orderBy(desc(topProductsAmount))
      .limit(10);

    const topCustomersAmount = sql<number>`cast(sum(${salesInvoices.netAmount}) as real)`;
    const topCustomers = await db
      .select({
        name: customers.name,
        amount: topCustomersAmount,
      })
      .from(salesInvoices)
      .innerJoin(customers, eq(customers.id, salesInvoices.customerId))
      .groupBy(customers.id)
      .orderBy(desc(topCustomersAmount))
      .limit(10);

    const topSuppliersAmount = sql<number>`cast(sum(${purchaseInvoices.netAmount}) as real)`;
    const topSuppliers = await db
      .select({
        name: suppliers.name,
        amount: topSuppliersAmount,
      })
      .from(purchaseInvoices)
      .innerJoin(suppliers, eq(suppliers.id, purchaseInvoices.supplierId))
      .groupBy(suppliers.id)
      .orderBy(desc(topSuppliersAmount))
      .limit(10);

    // 6. Daily Trends (This Month)
    const dailyTrendsQuery = await db
      .select({
        date: salesInvoices.invoiceDate,
        income: sql<number>`cast(sum(case when ${salesInvoices.netAmount} > 0 then ${salesInvoices.netAmount} else 0 end) as real)`,
        expenses: sql<number>`cast(0 as real)`,
      })
      .from(salesInvoices)
      .where(gte(salesInvoices.invoiceDate, monthStr))
      .groupBy(salesInvoices.invoiceDate);

    const purchaseTrendsQuery = await db
      .select({
        date: purchaseInvoices.invoiceDate,
        income: sql<number>`cast(0 as real)`,
        expenses: sql<number>`cast(sum(${purchaseInvoices.netAmount}) as real)`,
      })
      .from(purchaseInvoices)
      .where(gte(purchaseInvoices.invoiceDate, monthStr))
      .groupBy(purchaseInvoices.invoiceDate);

    // Merge trends
    const trendsMap = new Map<string, { income: number; expenses: number }>();
    for (const d of dailyTrendsQuery) {
      trendsMap.set(d.date, { income: d.income, expenses: 0 });
    }
    for (const p of purchaseTrendsQuery) {
      const existing = trendsMap.get(p.date) || { income: 0, expenses: 0 };
      trendsMap.set(p.date, { income: existing.income, expenses: p.expenses });
    }

    const dailyTrends = Array.from(trendsMap.entries())
      .map(([date, values]) => ({ date, ...values }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // 7. Recent Activities
    const recentSales = await db
      .select({
        id: salesInvoices.id,
        date: salesInvoices.invoiceDate,
        description: sql<string>`'Sale to ' || ${customers.name}`,
        amount: salesInvoices.netAmount,
        type: sql<string>`'I'`,
      })
      .from(salesInvoices)
      .innerJoin(customers, eq(customers.id, salesInvoices.customerId))
      .orderBy(desc(salesInvoices.id))
      .limit(5);

    const recentPurchases = await db
      .select({
        id: purchaseInvoices.id,
        date: purchaseInvoices.invoiceDate,
        description: sql<string>`'Purchase from ' || ${suppliers.name}`,
        amount: purchaseInvoices.netAmount,
        type: sql<string>`'E'`,
      })
      .from(purchaseInvoices)
      .innerJoin(suppliers, eq(suppliers.id, purchaseInvoices.supplierId))
      .orderBy(desc(purchaseInvoices.id))
      .limit(5);

    const recentActivities = [...recentSales, ...recentPurchases].sort((a, b) => b.date.localeCompare(a.date));

    // Format results
    const sales = {
      today: salesSummaryQuery.find((s) => s.period === 'today') || { count: 0, total: 0, profit: 0 },
      week: salesSummaryQuery.find((s) => s.period === 'week') || { count: 0, total: 0, profit: 0 },
      month: salesSummaryQuery.find((s) => s.period === 'month') || { count: 0, total: 0, profit: 0 },
      year: salesSummaryQuery.find((s) => s.period === 'year') || { count: 0, total: 0, profit: 0 },
    };

    const purchases = {
      today: purchaseSummaryQuery.find((p) => p.period === 'today') || { count: 0, total: 0, tax: 0 },
      week: purchaseSummaryQuery.find((p) => p.period === 'week') || { count: 0, total: 0, tax: 0 },
      month: purchaseSummaryQuery.find((p) => p.period === 'month') || { count: 0, total: 0, tax: 0 },
      year: purchaseSummaryQuery.find((p) => p.period === 'year') || { count: 0, total: 0, tax: 0 },
    };

    res.json({
      masters: {
        customers: customersCount,
        suppliers: suppliersCount,
        products: productsCount,
      },
      sales,
      purchases,
      stock: {
        total: stockSummary || { qty: 0, cost: 0 },
        reorderLevel: 0,
        outOfStock: 0,
      },
      topProducts,
      topCustomers,
      topSuppliers,
      aging: {
        stock: [],
        receivables: [],
        payables: [],
      },
      finance: {
        income: {
          today: sales.today.total,
          week: sales.week.total,
          month: sales.month.total,
          year: sales.year.total,
        },
        expenses: {
          today: purchases.today.total,
          week: purchases.week.total,
          month: purchases.month.total,
          year: purchases.year.total,
        },
        profit: {
          today: sales.today.total - purchases.today.total,
          week: sales.week.total - purchases.week.total,
          month: sales.month.total - purchases.month.total,
          year: sales.year.total - purchases.year.total,
        },
      },
      dailyTrends,
      recentActivities,
    });
  } catch (error) {
    LogService.error('Failed to fetch dashboard summary', error);
    res.status(500).json({ error: 'Failed to fetch dashboard summary' });
  }
});
