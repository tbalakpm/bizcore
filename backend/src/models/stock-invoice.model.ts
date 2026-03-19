import { InventoryModel } from './inventory.model';

export interface StockInvoiceItemModel {
  inventoryId?: number;
  productId?: number;
  gtn?: string;
  hsnSac?: string;
  taxRate?: number | string;
  // inventory?: InventoryModel;
  qty: number;
  unitPrice: number;
  marginType?: string;
  marginPct?: number | string;
  marginAmount?: number | string;
  sellingPrice?: number | string;
  lineTotal: number;
  location?: string;
}

export interface StockInvoiceModel {
  id?: number;
  invoiceNumber: string;
  invoiceDate: string;
  items: StockInvoiceItemModel[];
  totalQty: number;
  totalAmount: number;
}
