import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { pagination } from '../../models/pagination';

export interface Category {
  id: number;
  code: string;
  name: string;
  description?: string;
  parentCategoryId?: number;
  isActive: boolean;
}

export interface CategoryList {
  data: Category[];
  pagination: pagination;
}

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private http = inject(HttpClient);

  getAll(paramsObj?: {
    page?: number;
    limit?: number;
    sort?: string;
    code?: string;
    name?: string;
    description?: string;
    isActive?: boolean;
  }): Observable<CategoryList> {
    let params = new HttpParams();
    if (paramsObj) {
      if (paramsObj.page) params = params.set('page', paramsObj.page.toString());
      if (paramsObj.limit) params = params.set('limit', paramsObj.limit.toString());
      if (paramsObj.sort) params = params.set('sort', paramsObj.sort);
      if (paramsObj.code) params = params.set('code', paramsObj.code);
      if (paramsObj.name) params = params.set('name', paramsObj.name);
      if (paramsObj.description) params = params.set('description', paramsObj.description);
      if (paramsObj.isActive !== undefined) params = params.set('isActive', paramsObj.isActive.toString());
    }
    return this.http.get<CategoryList>(`${environment.apiUrl}/categories`, { params });
  }

  create(category: Partial<Category>): Observable<Category> {
    return this.http.post<Category>(`${environment.apiUrl}/categories`, category);
  }

  update(id: number, category: Partial<Category>): Observable<Category> {
    return this.http.put<Category>(`${environment.apiUrl}/categories/${id}`, category);
  }

  delete(id: number) {
    return this.http.delete(`${environment.apiUrl}/categories/${id}`);
  }
}
