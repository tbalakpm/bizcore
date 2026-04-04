import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface TaxRule {
  id: number;
  hsnCodeStartsWith: string;
  minPrice: number;
  maxPrice: number;
  taxRate: number;
  effectiveFrom: string;
}

@Injectable({ providedIn: 'root' })
export class TaxRuleService {
  private http = inject(HttpClient);

  getAll(): Observable<{ data: TaxRule[] }> {
    return this.http.get<{ data: TaxRule[] }>(`${environment.apiUrl}/tax-rules`);
  }

  getById(id: number): Observable<TaxRule> {
    return this.http.get<TaxRule>(`${environment.apiUrl}/tax-rules/${id}`);
  }

  create(payload: Partial<TaxRule>): Observable<TaxRule> {
    return this.http.post<TaxRule>(`${environment.apiUrl}/tax-rules`, payload);
  }

  update(id: number, payload: Partial<TaxRule>): Observable<TaxRule> {
    return this.http.put<TaxRule>(`${environment.apiUrl}/tax-rules/${id}`, payload);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/tax-rules/${id}`);
  }
}
