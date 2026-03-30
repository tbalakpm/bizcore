import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { pagination } from '../models/pagination';

export interface Product {
  id: number;
  code: string;
  name: string;
  description?: string;
  categoryId: number;
  qtyPerUnit?: string;
  unitPrice?: number;
  hsnSac?: string;
  taxRate?: number;
  gtnMode?: string;
  gtnGeneration?: string;
  gtnPrefix?: string;
  gtnStartPos?: number;
  gtnLength?: number;
  useGlobal?: boolean;
  // unitsInStock?: number;
  categoryName?: string;
  isActive: boolean;
  productType?: 'simple' | 'bundle';
  bundleItems?: {
    id?: number;
    productId: number;
    quantity: number;
    productName?: string; // For display
  }[];
}

export interface ProductList {
  data: Product[];
  pagination: pagination;
}

@Injectable({ providedIn: 'root' })
export class ProductService {
  private http = inject(HttpClient);

  getAll(paramsObj?: {
    page?: number;
    limit?: number;
    sort?: string;
    code?: string;
    name?: string;
    description?: string;
    categoryName?: string;
    categoryId?: number;
    qtyPerUnit?: string;
    hsnSac?: string;
    isActive?: boolean;
    minPrice?: number;
    maxPrice?: number;
  }): Observable<ProductList> {
    let params = new HttpParams();
    if (paramsObj) {
      if (paramsObj.page) params = params.set('page', paramsObj.page.toString());
      if (paramsObj.limit) params = params.set('limit', paramsObj.limit.toString());
      if (paramsObj.sort) params = params.set('sort', paramsObj.sort);
      if (paramsObj.code) params = params.set('code', paramsObj.code);
      if (paramsObj.name) params = params.set('name', paramsObj.name);
      if (paramsObj.description) params = params.set('description', paramsObj.description);
      if (paramsObj.categoryName) params = params.set('categoryName', paramsObj.categoryName);
      if (paramsObj.categoryId) params = params.set('categoryId', paramsObj.categoryId.toString());
      if (paramsObj.qtyPerUnit) params = params.set('qtyPerUnit', paramsObj.qtyPerUnit);
      if (paramsObj.hsnSac) params = params.set('hsnSac', paramsObj.hsnSac);
      if (paramsObj.isActive !== undefined) params = params.set('isActive', paramsObj.isActive.toString());
      if (paramsObj.minPrice) params = params.set('minPrice', paramsObj.minPrice.toString());
      if (paramsObj.maxPrice) params = params.set('maxPrice', paramsObj.maxPrice.toString());
    }
    return this.http.get<ProductList>(`${environment.apiUrl}/products`, { params });
  }

  getById(id: number): Observable<Product> {
    let params = new HttpParams();
    return this.http.get<Product>(`${environment.apiUrl}/products/${id}`, { params });
  }

  create(product: Partial<Product>): Observable<Product> {
    return this.http.post<Product>(`${environment.apiUrl}/products`, product);
  }

  update(id: number, product: Partial<Product>): Observable<Product> {
    return this.http.put<Product>(`${environment.apiUrl}/products/${id}`, product);
  }

  delete(id: number) {
    return this.http.delete(`${environment.apiUrl}/products/${id}`);
  }
}
