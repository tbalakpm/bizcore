import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { pagination } from '../models/pagination';
import { AuthService } from '../auth/auth-service';

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
  marginType?: string;
  marginPct?: number | string;
  marginAmount?: number | string;
  sellingPrice?: number | string;
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

export interface PrintableBarcodeLabel {
  title: string;
  code: string;
  subtitle: string;
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
  private auth = inject(AuthService);

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

  /** fetch pre-built barcode labels from backend */
  getBarcodeLabels(id: number): Observable<{ labels: PrintableBarcodeLabel[] }> {
    return this.http.get<{ labels: PrintableBarcodeLabel[] }>(
      `${environment.apiUrl}/stock-invoices/${id}/barcodes`,
    );
  }

  /** when you just want to open the PDF in a new window */
  getBarcodePdfUrl(id: number): string {
    const baseUrl = `${environment.apiUrl}/stock-invoices/${id}/barcodes/pdf`;
    const token = this.auth.token;
    return token ? `${baseUrl}?token=${token}` : baseUrl;
  }
}
