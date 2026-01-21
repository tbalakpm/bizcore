import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Entry {
  id: number;
  date: string; // ISO yyyy-MM-dd
  amount: number;
  description?: string;
  registerId?: number | null;
  // register?: { id: number; name: string; category?: { id: number; name: string; type: string } };
  registerName?: string;
  categoryName?: string;
  categoryType?: string;
  isActive: boolean;
}

export interface EntryListResponse {
  items: Entry[];
  totalExpenses: number;
  totalIncome: number;
}

@Injectable({ providedIn: 'root' })
export class EntryService {
  private http = inject(HttpClient);

  getEntries(startDate?: string, endDate?: string): Observable<EntryListResponse> {
    let params = new HttpParams();
    if (startDate) params = params.set('startDate', startDate);
    if (endDate) params = params.set('endDate', endDate);

    return this.http.get<EntryListResponse>(`${environment.apiUrl}/entries`, { params });
  }

  get(id: number): Observable<Entry> {
    return this.http.get<Entry>(`${environment.apiUrl}/entries/${id}`);
  }

  create(entry: Partial<Entry>): Observable<Entry> {
    return this.http.post<Entry>(`${environment.apiUrl}/entries`, entry);
  }

  update(id: number, entry: Partial<Entry>): Observable<Entry> {
    return this.http.put<Entry>(`${environment.apiUrl}/entries/${id}`, entry);
  }

  delete(id: number) {
    return this.http.delete(`${environment.apiUrl}/entries/${id}`);
  }
}
