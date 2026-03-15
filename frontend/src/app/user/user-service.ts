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
}

export interface UserList {
  data: User[];
  pagination: pagination;
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private http = inject(HttpClient);

  getAll(): Observable<UserList> {
    let params = new HttpParams();
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
}
