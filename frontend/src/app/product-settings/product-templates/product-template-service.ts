import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ProductTemplateAttribute {
  id?: number;
  attributeId: number;
  name?: string;
  type?: string;
  isVariantDefining: boolean;
}

export interface ProductTemplate {
  id?: number;
  name: string;
  description?: string;
  isActive: boolean;
  mappedAttributes?: ProductTemplateAttribute[];
}

@Injectable({
  providedIn: 'root'
})
export class ProductTemplateService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/product-templates`;

  getTemplates(): Observable<ProductTemplate[]> {
    return this.http.get<ProductTemplate[]>(this.apiUrl);
  }

  createTemplate(template: Partial<ProductTemplate>): Observable<ProductTemplate> {
    return this.http.post<ProductTemplate>(this.apiUrl, template);
  }

  updateTemplate(id: number, template: Partial<ProductTemplate>): Observable<ProductTemplate> {
    return this.http.put<ProductTemplate>(`${this.apiUrl}/${id}`, template);
  }

  deleteTemplate(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
