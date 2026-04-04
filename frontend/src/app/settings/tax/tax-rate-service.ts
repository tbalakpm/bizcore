import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface TaxRate {
  id: number;
  rate: number;
  cgstRate: number;
  sgstRate: number;
  igstRate: number;
  cessRate: number;
  cessAmount: number;
  effectiveFrom: string;
}

@Injectable({ providedIn: 'root' })
export class TaxRateService {
  private http = inject(HttpClient);

  getAll(): Observable<{ data: TaxRate[] }> {
    return this.http.get<{ data: TaxRate[] }>(`${environment.apiUrl}/tax-rates`);
  }

  getById(id: number): Observable<TaxRate> {
    return this.http.get<TaxRate>(`${environment.apiUrl}/tax-rates/${id}`);
  }

  create(payload: Partial<TaxRate>): Observable<TaxRate> {
    return this.http.post<TaxRate>(`${environment.apiUrl}/tax-rates`, payload);
  }

  update(id: number, payload: Partial<TaxRate>): Observable<TaxRate> {
    return this.http.put<TaxRate>(`${environment.apiUrl}/tax-rates/${id}`, payload);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/tax-rates/${id}`);
  }
}
