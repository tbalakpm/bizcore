import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Attribute {
  id?: number;
  name: string;
  description: string;
  type: 'single_select' | 'multi_select' | 'text' | 'number' | 'boolean';
  options: any; // Array for select types
  defaultValue: any;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({
  providedIn: 'root',
})
export class AttributeService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/attributes`;

  getAttributes(): Observable<Attribute[]> {
    return this.http.get<Attribute[]>(this.apiUrl);
  }

  createAttribute(attribute: Attribute): Observable<Attribute> {
    return this.http.post<Attribute>(this.apiUrl, attribute);
  }

  updateAttribute(id: number, attribute: Attribute): Observable<Attribute> {
    return this.http.put<Attribute>(`${this.apiUrl}/${id}`, attribute);
  }

  deleteAttribute(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
