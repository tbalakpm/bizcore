import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { pagination } from '../models/pagination';
import { AuthService } from '../auth/auth-service';

export interface SalesInvoiceItem {
  id?: number;
  salesInvoiceId?: number;
  inventoryId?: number;
  gtn?: string;
  productId?: number;
  qty: number;
  unitPrice: number;
  discountBy?: string;
  discountPct?: number | string;
  discountAmount?: number | string;
  taxPct?: number | string;
  taxAmount?: number | string;
  lineTotal: number;
  
  // Joined fields from db
  productCode?: string;
  productName?: string;
}

export interface SalesInvoice {
  id: number;
  invoiceNumber: string;
  invoiceDate: string;
  customerId: number;
  refNumber?: string;
  refDate?: string;
  totalQty: number;
  subtotal: number;
  discountBy?: string;
  discountPct?: number | string;
  discountAmount?: number | string;
  taxPct?: number | string;
  taxAmount?: number | string;
  netAmount: number;
  
  // E-Invoice Metadata
  irn?: string;
  ackNo?: string;
  ackDate?: string;
  signedQrCode?: string;
  
  items?: SalesInvoiceItem[];
  
  // Joined fields
  customerName?: string;
}

export interface SalesInvoiceList {
  data: SalesInvoice[];
  pagination: pagination;
}

export type SalesInvoiceQuery = {
  page?: number;
  limit?: number;
  invoiceNumber?: string;
  invoiceDate?: string;
  minAmount?: number;
  maxAmount?: number;
  sort?: string;
};

@Injectable({ providedIn: 'root' })
export class SalesInvoiceService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);

  getAll(query: SalesInvoiceQuery = {}): Observable<SalesInvoiceList> {
    let params = new HttpParams();

    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    }

    return this.http.get<SalesInvoiceList>(`${environment.apiUrl}/sales-invoices`, { params });
  }

  getById(id: number): Observable<SalesInvoice> {
    return this.http.get<SalesInvoice>(`${environment.apiUrl}/sales-invoices/${id}`);
  }

  create(payload: Partial<SalesInvoice>): Observable<SalesInvoice> {
    return this.http.post<SalesInvoice>(`${environment.apiUrl}/sales-invoices`, payload);
  }

  update(id: number, payload: Partial<SalesInvoice>): Observable<SalesInvoice> {
    return this.http.put<SalesInvoice>(`${environment.apiUrl}/sales-invoices/${id}`, payload);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/sales-invoices/${id}`);
  }

  /** when you just want to open the PDF in a new window */
  getPdfUrl(id: number): string {
    const baseUrl = `${environment.apiUrl}/sales-invoices/${id}/pdf`;
    const token = this.auth.token;
    return token ? `${baseUrl}?token=${token}` : baseUrl;
  }
  
  generateIrn(id: number): Observable<SalesInvoice> {
    return this.http.post<SalesInvoice>(`${environment.apiUrl}/sales-invoices/${id}/generate-irn`, {});
  }
}
