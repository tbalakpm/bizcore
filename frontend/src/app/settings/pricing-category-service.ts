import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { pagination } from '../models/pagination';

export interface PricingCategory {
  id: number;
  code: string;
  name: string;
  description?: string;
  isActive: boolean;
}

export interface PricingCategoryList {
  data: PricingCategory[];
  pagination: pagination;
}

export interface ProductMargin {
  id?: number;
  pricingCategoryId?: number;
  productId: number;
  productCode?: string;
  productName?: string;
  marginType: 'none' | 'percent' | 'amount';
  marginPct: number;
  marginAmount: number;
}

@Injectable({ providedIn: 'root' })
export class PricingCategoryService {
  private http = inject(HttpClient);

  getAll(paramsObj?: { page?: number; limit?: number; sort?: string; isActive?: boolean }): Observable<PricingCategoryList> {
    let params = new HttpParams();
    if (paramsObj) {
      if (paramsObj.page) params = params.set('page', paramsObj.page.toString());
      if (paramsObj.limit) params = params.set('limit', paramsObj.limit.toString());
      if (paramsObj.sort) params = params.set('sort', paramsObj.sort);
      if (paramsObj.isActive !== undefined) params = params.set('isActive', paramsObj.isActive.toString());
    }
    return this.http.get<PricingCategoryList>(`${environment.apiUrl}/pricing-categories`, { params });
  }

  create(category: Partial<PricingCategory>): Observable<PricingCategory> {
    return this.http.post<PricingCategory>(`${environment.apiUrl}/pricing-categories`, category);
  }

  update(id: number, category: Partial<PricingCategory>): Observable<PricingCategory> {
    return this.http.put<PricingCategory>(`${environment.apiUrl}/pricing-categories/${id}`, category);
  }

  delete(id: number) {
    return this.http.delete(`${environment.apiUrl}/pricing-categories/${id}`);
  }

  getProducts(categoryId: number): Observable<ProductMargin[]> {
    return this.http.get<ProductMargin[]>(`${environment.apiUrl}/pricing-categories/${categoryId}/products`);
  }

  saveProducts(categoryId: number, margins: ProductMargin[]): Observable<{ success: boolean }> {
    return this.http.put<{ success: boolean }>(`${environment.apiUrl}/pricing-categories/${categoryId}/products`, margins);
  }
}
