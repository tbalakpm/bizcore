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
  gtnGeneration?: string;
  gtnPrefix?: string;
  gtnStartPos?: string;
  unitsInStock?: number;
  categoryName?: string;
  isActive: boolean;
}

export interface ProductList {
  data: Product[];
  pagination: pagination;
}

@Injectable({ providedIn: 'root' })
export class ProductService {
  private http = inject(HttpClient);

  getAll(): Observable<ProductList> {
    let params = new HttpParams();
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
