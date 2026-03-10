export interface InventoryModel {
  inventoryId?: number;
  productId: number;
  gtn?: string;
  qtyPerUnit?: string;
  hsnSac?: string;
  taxRate?: number;
  buyingPrice?: number;
  sellingPrice?: number;
  unitsInStock?: number;
  location?: string;
}
