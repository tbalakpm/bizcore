import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { pagination } from '../models/pagination';

export interface Inventory {
  id: number;
  productId: number;
  gtn?: string;
  unitsInStock: number;
  location?: string;
  // Joined fields
  code?: string;
  name?: string;
}

export interface InventoryList {
  data: Inventory[];
  pagination: pagination;
}

@Injectable({ providedIn: 'root' })
export class InventoryService {
  private http = inject(HttpClient);

  // Fetch only available stock items with search and pagination
  getAvailableStock(q?: string, limit: number = 50, offset: number = 0): Observable<InventoryList> {
    let params = new HttpParams()
      .set('limit', limit.toString())
      .set('offset', offset.toString());
    
    if (q) {
      params = params.set('q', q);
    }
    
    params = params.set('inStock', 'true');

    return this.http.get<InventoryList>(`${environment.apiUrl}/inventories`, { params });
  }
}
