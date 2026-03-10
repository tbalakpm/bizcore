import { InventoryModel } from './inventory.model';

export interface StockInvoiceItemModel {
  //   inventoryId?: number;
  //   productId?: number;
  inventory: InventoryModel;
  qty: number;
  unitPrice: number;
  totalAmount: number;
}

export interface StockInvoiceModel {
  invoiceNumber: string;
  invoiceDate: Date;
  items: StockInvoiceItemModel[];
  totalQty: number;
  totalAmount: number;
  status: string;
  notes: string;
}
