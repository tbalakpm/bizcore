import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import type { User } from './user-service';

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private http = inject(HttpClient);

  getProfile(): Observable<User> {
    return this.http.get<User>(`${environment.apiUrl}/profile`);
  }

  updateProfile(data: { firstName?: string; lastName?: string }): Observable<User> {
    return this.http.put<User>(`${environment.apiUrl}/profile`, data);
  }

  changePassword(data: { currentPassword?: string; newPassword?: string }): Observable<unknown> {
    return this.http.post(`${environment.apiUrl}/profile/change-password`, data);
  }
}
