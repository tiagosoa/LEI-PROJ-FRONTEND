import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { environment } from '../environments/environment';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  data: {
    token: string;
    user: {
      username: string;
      isAdmin: boolean;
    };
  };
}

export interface User {
  username: string;
  isAdmin: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl;
  private tokenKey = 'auth_token';
  private userKey = 'auth_user';
  
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  
  constructor(private http: HttpClient) {
    // Tentar restaurar sessão ao iniciar
    const savedToken = localStorage.getItem(this.tokenKey);
    const savedUser = localStorage.getItem(this.userKey);
    if (savedToken && savedUser) {
      this.currentUserSubject.next(JSON.parse(savedUser));
    }
  }
  
  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/auth/login`, credentials)
      .pipe(
        tap(response => {
          if (response.success && response.data) {
            this.setSession(response.data);
          }
        }),
        catchError(error => {
          return throwError(() => error);
        })
      );
  }
  
  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    this.currentUserSubject.next(null);
  }
  
  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;
    
    // Verificar se token expirou
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp * 1000;
      return Date.now() < exp;
    } catch {
      return false;
    }
  }
  
  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }
  
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }
  
  private setSession(authData: { token: string; user: User }): void {
    localStorage.setItem(this.tokenKey, authData.token);
    localStorage.setItem(this.userKey, JSON.stringify(authData.user));
    this.currentUserSubject.next(authData.user);
  }
}