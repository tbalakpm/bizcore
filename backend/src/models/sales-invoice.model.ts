import type { NewSalesInvoiceWithItems, SalesInvoice, SalesInvoiceItem } from '../db';

export type SalesInvoiceModel = SalesInvoice;

export type SalesInvoiceItemModel = SalesInvoiceItem;

export type SalesInvoiceInput = Partial<Omit<SalesInvoiceModel, 'items'>> & { 
  items?: Partial<SalesInvoiceItemModel>[];
};
