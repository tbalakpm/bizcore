import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { pagination } from '../models/pagination';

import type { UserPermissions } from '../models/permission.model';

export interface User {
  id: number;
  username: string;
  firstName?: string;
  lastName?: string;
  role: string;
  permissions?: string | Partial<UserPermissions>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserList {
  data: User[];
  pagination: pagination;
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private http = inject(HttpClient);

  getAll(paramsObj?: {
    page?: number;
    limit?: number;
    sort?: string;
    username?: string;
    firstName?: string;
    lastName?: string;
    role?: string;
    isActive?: boolean;
  }): Observable<UserList> {
    let params = new HttpParams();
    if (paramsObj) {
      if (paramsObj.page) params = params.set('page', paramsObj.page.toString());
      if (paramsObj.limit) params = params.set('limit', paramsObj.limit.toString());
      if (paramsObj.sort) params = params.set('sort', paramsObj.sort);
      if (paramsObj.username) params = params.set('username', paramsObj.username);
      if (paramsObj.firstName) params = params.set('firstName', paramsObj.firstName);
      if (paramsObj.lastName) params = params.set('lastName', paramsObj.lastName);
      if (paramsObj.role) params = params.set('role', paramsObj.role);
      if (paramsObj.isActive !== undefined) params = params.set('isActive', paramsObj.isActive.toString());
    }
    return this.http.get<UserList>(`${environment.apiUrl}/users`, { params });
  }

  getById(id: number): Observable<User> {
    let params = new HttpParams();
    return this.http.get<User>(`${environment.apiUrl}/users/${id}`, { params });
  }

  create(user: Partial<User>): Observable<User> {
    return this.http.post<User>(`${environment.apiUrl}/users`, user);
  }

  update(id: number, user: Partial<User>): Observable<User> {
    return this.http.put<User>(`${environment.apiUrl}/users/${id}`, user);
  }

  delete(id: number) {
    return this.http.delete(`${environment.apiUrl}/users/${id}`);
  }

  resetPassword(id: number, newPassword: string): Observable<unknown> {
    return this.http.post(`${environment.apiUrl}/users/${id}/reset-password`, { newPassword });
  }
}
