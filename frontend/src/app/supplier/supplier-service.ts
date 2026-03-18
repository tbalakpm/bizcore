import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { pagination } from '../models/pagination';

export interface Address {
  id?: number;
  addressLine1?: string;
  addressLine2?: string;
  area?: string;
  city?: string;
  taluk?: string;
  district?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  phone?: string;
  mobile?: string;
  email?: string;
  website?: string;
  latitude?: string;
  longitude?: string;
}

export interface SupplierBank {
  id?: number;
  supplierId?: number;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  branchName: string;
  isPrimary: boolean;
}

export interface Supplier {
  id: number;
  code: string;
  name: string;
  gstin?: string;
  billingAddressId?: number;
  shippingAddressId?: number;
  billingAddress?: Address;
  shippingAddress?: Address;
  notes?: string;
  isActive: boolean;
  bankAccounts?: SupplierBank[];
}

export interface SupplierList {
  data: Supplier[];
  pagination: pagination;
}

@Injectable({ providedIn: 'root' })
export class SupplierService {
  private http = inject(HttpClient);

  getAll(): Observable<SupplierList> {
    let params = new HttpParams();
    return this.http.get<SupplierList>(`${environment.apiUrl}/suppliers`, { params });
  }

  getById(id: number): Observable<Supplier> {
    let params = new HttpParams();
    return this.http.get<Supplier>(`${environment.apiUrl}/suppliers/${id}`, { params });
  }

  create(supplier: Partial<Supplier>): Observable<Supplier> {
    return this.http.post<Supplier>(`${environment.apiUrl}/suppliers`, supplier);
  }

  update(id: number, supplier: Partial<Supplier>): Observable<Supplier> {
    return this.http.put<Supplier>(`${environment.apiUrl}/suppliers/${id}`, supplier);
  }

  delete(id: number) {
    return this.http.delete(`${environment.apiUrl}/suppliers/${id}`);
  }
}
