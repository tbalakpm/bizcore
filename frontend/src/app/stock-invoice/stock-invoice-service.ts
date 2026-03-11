import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { pagination } from '../models/pagination';

export interface StockInvoiceItem {
  id?: number;
  stockInvoiceId?: number;
  inventoryId?: number;
  productId?: number;
  gtn?: string;
  hsnSac?: string;
  taxRate?: number | string;
  productCode?: string;
  productName?: string;
  qty: number;
  unitPrice: number;
  lineTotal: number;
}

export interface StockInvoice {
  id: number;
  invoiceNumber: string;
  invoiceDate: string;
  totalQty: number;
  totalAmount: number;
  items?: StockInvoiceItem[];
}

export interface StockInvoiceList {
  data: StockInvoice[];
  pagination: pagination;
}

export type StockInvoiceQuery = {
  page?: number;
  limit?: number;
  invoiceNumber?: string;
  invoiceDate?: string;
  minAmount?: number;
  maxAmount?: number;
  sort?: string;
};

@Injectable({ providedIn: 'root' })
export class StockInvoiceService {
  private http = inject(HttpClient);

  getAll(query: StockInvoiceQuery = {}): Observable<StockInvoiceList> {
    let params = new HttpParams();

    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    }

    return this.http.get<StockInvoiceList>(`${environment.apiUrl}/stock-invoices`, { params });
  }

  getById(id: number): Observable<StockInvoice> {
    return this.http.get<StockInvoice>(`${environment.apiUrl}/stock-invoices/${id}`);
  }

  create(payload: Partial<StockInvoice>): Observable<StockInvoice> {
    return this.http.post<StockInvoice>(`${environment.apiUrl}/stock-invoices`, payload);
  }

  update(id: number, payload: Partial<StockInvoice>): Observable<StockInvoice> {
    return this.http.put<StockInvoice>(`${environment.apiUrl}/stock-invoices/${id}`, payload);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/stock-invoices/${id}`);
  }
}
