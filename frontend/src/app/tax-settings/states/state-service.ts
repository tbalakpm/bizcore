import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import type { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface State {
  id: number;
  stateName: string;
  stateCode: string;
  stateShortCode: string;
  countryCode: string;
  isUnionTerritory: boolean;
  isActive: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class StateService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/states`;

  getAll(): Observable<{ data: State[] }> {
    return this.http.get<{ data: State[] }>(this.apiUrl);
  }

  create(state: Partial<State>): Observable<State> {
    return this.http.post<State>(this.apiUrl, state);
  }

  update(id: number, state: Partial<State>): Observable<State> {
    return this.http.put<State>(`${this.apiUrl}/${id}`, state);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
