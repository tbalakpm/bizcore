import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Register {
  id: number;
  name: string;
  description?: string;
  categoryId: number;
  amount?: number;
  date?: string; // ISO yyyy-MM-dd
  //category: { id: number; name: string; type: string } | null;
  categoryName?: string;
  categoryType?: string;
  isActive: boolean;
}

@Injectable({ providedIn: 'root' })
export class RegisterService {
  private http = inject(HttpClient);

  getAll(): Observable<Register[]> {
    let params = new HttpParams();
    return this.http.get<Register[]>(`${environment.apiUrl}/registers`, { params });
  }

  getById(id: number): Observable<Register> {
    let params = new HttpParams();
    return this.http.get<Register>(`${environment.apiUrl}/registers/${id}`, { params });
  }

  create(register: Partial<Register>): Observable<Register> {
    return this.http.post<Register>(`${environment.apiUrl}/registers`, register);
  }

  update(id: number, register: Partial<Register>): Observable<Register> {
    return this.http.put<Register>(`${environment.apiUrl}/registers/${id}`, register);
  }

  delete(id: number) {
    return this.http.delete(`${environment.apiUrl}/registers/${id}`);
  }
}
