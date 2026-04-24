import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly baseUrl = 'http://localhost:8000/api';

  private getAuthHeaders(includeJsonContentType = true): HttpHeaders {
    const token = isPlatformBrowser(this.platformId) ? localStorage.getItem('auth_token') : null;
    const headers: Record<string, string> = {
      'Accept': 'application/json',
    };

    if (includeJsonContentType) {
      headers['Content-Type'] = 'application/json';
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return new HttpHeaders(headers);
  }

  get<T>(path: string, auth = false): Observable<T> {
    const headers = new HttpHeaders({
      'Accept': 'application/json',
    });

    return this.http.get<T>(`${this.baseUrl}/${path}`, { headers });
  }

  post<T>(path: string, body: unknown, auth = false): Observable<T> {
    if (body instanceof FormData) {
      const headers = auth ? this.getAuthHeaders(false) : new HttpHeaders({
        'Accept': 'application/json',
      });
      return this.http.post<T>(`${this.baseUrl}/${path}`, body, { headers });
    }

    const headers = auth ? this.getAuthHeaders(true) : new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    });

    return this.http.post<T>(`${this.baseUrl}/${path}`, JSON.stringify(body), { headers });
  }

  put<T>(path: string, body: unknown, auth = true): Observable<T> {
    if (body instanceof FormData) {
      return this.http.put<T>(`${this.baseUrl}/${path}`, body, { headers: this.getAuthHeaders(false) });
    }

    const headers = auth ? this.getAuthHeaders(true) : new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    });
    
    return this.http.put<T>(`${this.baseUrl}/${path}`, JSON.stringify(body), { headers });
  }

  delete<T>(path: string, auth = true): Observable<T> {
    const headers = auth ? this.getAuthHeaders(false) : new HttpHeaders({
      'Accept': 'application/json',
    });
    
    return this.http.delete<T>(`${this.baseUrl}/${path}`, { headers });
  }
}

