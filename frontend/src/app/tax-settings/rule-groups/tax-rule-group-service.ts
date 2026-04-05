import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { TaxRuleGroup } from '../tax.model';

@Injectable({ providedIn: 'root' })
export class TaxRuleGroupService {
  private http = inject(HttpClient);

  getAll(): Observable<{ data: TaxRuleGroup[] }> {
    return this.http.get<{ data: TaxRuleGroup[] }>(`${environment.apiUrl}/tax-rule-groups`);
  }

  getById(id: number): Observable<TaxRuleGroup> {
    return this.http.get<TaxRuleGroup>(`${environment.apiUrl}/tax-rule-groups/${id}`);
  }

  create(payload: Partial<TaxRuleGroup>): Observable<TaxRuleGroup> {
    return this.http.post<TaxRuleGroup>(`${environment.apiUrl}/tax-rule-groups`, payload);
  }

  update(id: number, payload: Partial<TaxRuleGroup>): Observable<TaxRuleGroup> {
    return this.http.put<TaxRuleGroup>(`${environment.apiUrl}/tax-rule-groups/${id}`, payload);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/tax-rule-groups/${id}`);
  }
}
