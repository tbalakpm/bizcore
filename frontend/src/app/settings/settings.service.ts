import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface AppSetting {
  id?: number;
  key: string;
  value: string;
}

@Injectable({
  providedIn: 'root',
})
export class SettingsService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/settings`;

  getAllSettings(): Observable<{ data: AppSetting[] }> {
    return this.http.get<{ data: AppSetting[] }>(this.apiUrl);
  }

  getSetting(key: string): Observable<AppSetting> {
    return this.http.get<AppSetting>(`${this.apiUrl}/${key}`);
  }

  updateSetting(key: string, value: string): Observable<AppSetting> {
    return this.http.put<AppSetting>(`${this.apiUrl}/${key}`, { value });
  }

  getInvoiceConfigs(): Observable<{ data: any[] }> {
    return this.http.get<{ data: any[] }>(`${environment.apiUrl}/serial-numbers/invoice-configs`);
  }

  updateInvoiceConfig(key: string, data: any): Observable<any> {
    return this.http.put<any>(`${environment.apiUrl}/serial-numbers/invoice-configs/${key}`, data);
  }
}
