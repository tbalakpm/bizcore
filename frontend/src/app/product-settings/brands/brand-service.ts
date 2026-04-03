import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { pagination } from '../../models/pagination';

export interface Brand {
  id: number;
  code: string;
  name: string;
  description?: string;
  
  isActive: boolean;
}

export interface BrandList {
  data: Brand[];
  pagination: pagination;
}

@Injectable({ providedIn: 'root' })
export class BrandService {
  private http = inject(HttpClient);

  getAll(paramsObj?: {
    page?: number;
    limit?: number;
    sort?: string;
    code?: string;
    name?: string;
    description?: string;
    isActive?: boolean;
  }): Observable<BrandList> {
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
    return this.http.get<BrandList>(`${environment.apiUrl}/brands`, { params });
  }

  create(brand: Partial<Brand>): Observable<Brand> {
    return this.http.post<Brand>(`${environment.apiUrl}/brands`, brand);
  }

  update(id: number, brand: Partial<Brand>): Observable<Brand> {
    return this.http.put<Brand>(`${environment.apiUrl}/brands/${id}`, brand);
  }

  delete(id: number) {
    return this.http.delete(`${environment.apiUrl}/brands/${id}`);
  }
}
