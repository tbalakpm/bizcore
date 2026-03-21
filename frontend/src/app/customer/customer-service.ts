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

export interface Customer {
  id: number;
  code: string;
  name: string;
  type?: string;
  gstin?: string;
  pricingCategoryId?: number;
  pricingCategoryName?: string;
  billingAddressId?: number;
  shippingAddressId?: number;
  billingAddress?: Address;
  shippingAddress?: Address;
  notes?: string;
  isActive: boolean;
}

export interface CustomerList {
  data: Customer[];
  pagination: pagination;
}

@Injectable({ providedIn: 'root' })
export class CustomerService {
  private http = inject(HttpClient);

  getAll(paramsObj?: {
    page?: number;
    limit?: number;
    sort?: string;
    code?: string;
    name?: string;
    type?: string;
    gstin?: string;
    notes?: string;
    isActive?: boolean;
  }): Observable<CustomerList> {
    let params = new HttpParams();
    if (paramsObj) {
      if (paramsObj.page) params = params.set('page', paramsObj.page.toString());
      if (paramsObj.limit) params = params.set('limit', paramsObj.limit.toString());
      if (paramsObj.sort) params = params.set('sort', paramsObj.sort);
      if (paramsObj.code) params = params.set('code', paramsObj.code);
      if (paramsObj.name) params = params.set('name', paramsObj.name);
      if (paramsObj.type) params = params.set('type', paramsObj.type);
      if (paramsObj.gstin) params = params.set('gstin', paramsObj.gstin);
      if (paramsObj.notes) params = params.set('notes', paramsObj.notes);
      if (paramsObj.isActive !== undefined) params = params.set('isActive', paramsObj.isActive.toString());
    }
    return this.http.get<CustomerList>(`${environment.apiUrl}/customers`, { params });
  }

  getById(id: number): Observable<Customer> {
    let params = new HttpParams();
    return this.http.get<Customer>(`${environment.apiUrl}/customers/${id}`, { params });
  }

  create(customer: Partial<Customer>): Observable<Customer> {
    return this.http.post<Customer>(`${environment.apiUrl}/customers`, customer);
  }

  update(id: number, customer: Partial<Customer>): Observable<Customer> {
    return this.http.put<Customer>(`${environment.apiUrl}/customers/${id}`, customer);
  }

  delete(id: number) {
    return this.http.delete(`${environment.apiUrl}/customers/${id}`);
  }
}
