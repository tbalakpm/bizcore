import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface GstinDetails {
  name: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  phone?: string;
  mobile?: string;
  gstin: string;
}

export interface CaptchaResponse {
  captcha: string; // Base64 image
  sessionId: string;
}

@Injectable({ providedIn: 'root' })
export class GstService {
  private http = inject(HttpClient);

  getCaptcha(): Observable<CaptchaResponse> {
    return this.http.get<CaptchaResponse>(`${environment.apiUrl}/gst/captcha`);
  }

  getGstinDetails(gstin: string, captcha: string, sessionId: string): Observable<GstinDetails> {
    return this.http.post<GstinDetails>(`${environment.apiUrl}/gst/details`, {
      gstin,
      captcha,
      sessionId
    });
  }
}
