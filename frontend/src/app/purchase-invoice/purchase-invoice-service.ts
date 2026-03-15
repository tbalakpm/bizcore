import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { pagination } from '../models/pagination';

export interface PurchaseInvoiceItem {
  id?: number;
  purchaseInvoiceId?: number;
  inventoryId?: number;
  productId?: number;
  gtn?: string;
  hsnSac?: string;
  taxRate?: number | string;
  qty: number;
  unitPrice: number;
  discountType: string;
  discountPct: number | string;
  discountAmount: number | string;
  taxPct: number | string;
  taxAmount?: number | string;
  lineTotal?: number | string;
  productCode?: string;
  productName?: string;
}

export interface PurchaseInvoice {
  id: number;
  invoiceNumber: string;
  invoiceDate: string;
  supplierId: number;
  supplierName?: string;
  refNumber?: string;
  refDate?: string;
  totalQty: number | string;
  subtotal: number | string;
  discountType: string;
  discountPct: number | string;
  discountAmount: number | string;
  taxPct: number | string;
  taxAmount?: number | string;
  roundOff: number | string;
  netAmount?: number | string;
  items?: PurchaseInvoiceItem[];
}

export interface PurchaseInvoiceList {
  data: PurchaseInvoice[];
  pagination: pagination;
}

export type PurchaseInvoiceQuery = {
  page?: number;
  limit?: number;
  invoiceNumber?: string;
  invoiceDate?: string;
  supplierId?: number;
  sort?: string;
};

@Injectable({ providedIn: 'root' })
export class PurchaseInvoiceService {
  private http = inject(HttpClient);

  getAll(query: PurchaseInvoiceQuery = {}): Observable<PurchaseInvoiceList> {
    let params = new HttpParams();

    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    }

    return this.http.get<PurchaseInvoiceList>(`${environment.apiUrl}/purchase-invoices`, { params });
  }

  getById(id: number): Observable<PurchaseInvoice & { items: PurchaseInvoiceItem[] }> {
    return this.http.get<PurchaseInvoice & { items: PurchaseInvoiceItem[] }>(`${environment.apiUrl}/purchase-invoices/${id}`);
  }

  create(payload: Partial<PurchaseInvoice>): Observable<PurchaseInvoice> {
    return this.http.post<PurchaseInvoice>(`${environment.apiUrl}/purchase-invoices`, payload);
  }

  update(id: number, payload: Partial<PurchaseInvoice>): Observable<PurchaseInvoice> {
    return this.http.put<PurchaseInvoice>(`${environment.apiUrl}/purchase-invoices/${id}`, payload);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/purchase-invoices/${id}`);
  }
}
