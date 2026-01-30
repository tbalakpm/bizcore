import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { pagination } from '../models/pagination';

export interface Category {
  id: number;
  code: string;
  name: string;
  description?: string;
  isActive: boolean;
}

export interface CategoryList {
  data: Category[];
  pagination: pagination;
}

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private http = inject(HttpClient);

  getAll(): Observable<CategoryList> {
    return this.http.get<CategoryList>(`${environment.apiUrl}/categories`);
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
