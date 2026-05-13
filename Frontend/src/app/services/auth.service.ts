import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { LoginRequest, LoginResponse, User } from '../models/auth.model';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private apiUrl = '/api';
    private tokenKey = 'auth_token';
    private userKey = 'auth_user';
    
    private currentUserSubject = new BehaviorSubject<User | null>(null);
    public currentUser$ = this.currentUserSubject.asObservable();
    
    constructor(private http: HttpClient) {
        // Tentar restaurar sessão ao iniciar (importante para refresh)
        this.loadStoredSession();
    }
    
    /**
     * Carrega a sessão guardada no localStorage
     */
    private loadStoredSession(): void {
        const savedUser = localStorage.getItem(this.userKey);
        const token = localStorage.getItem(this.tokenKey);
        
        if (savedUser && token) {
            try {
                const user = JSON.parse(savedUser);
                this.currentUserSubject.next(user);
                console.log('AuthService: Session restored for user:', user.username);
            } catch (error) {
                console.error('AuthService: Error restoring session:', error);
                this.logout();
            }
        } else {
            console.log('AuthService: No stored session found');
        }
    }
    
    /**
     * Autentica o utilizador com LDAP
     */
    login(credentials: LoginRequest): Observable<LoginResponse> {
        return this.http.post<LoginResponse>(`${this.apiUrl}/auth/login`, credentials)
            .pipe(
                tap(response => {
                    if (response.success && response.data) {
                        this.setSession(response.data);
                    }
                }),
                catchError(error => {
                    console.error('AuthService: Login error:', error);
                    throw error;
                })
            );
    }
    
    /**
     * Termina a sessão do utilizador
     */
    logout(): void {
        localStorage.removeItem(this.tokenKey);
        localStorage.removeItem(this.userKey);
        this.currentUserSubject.next(null);
        console.log('AuthService: User logged out');
    }
    
    /**
     * Verifica se o utilizador está autenticado
     */
    isAuthenticated(): boolean {
        const token = this.getToken();
        if (!token) return false;
        
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const exp = payload.exp * 1000;
            const isValid = Date.now() < exp;
            if (!isValid) {
                console.log('AuthService: Token expired');
                this.logout();
            }
            return isValid;
        } catch {
            return false;
        }
    }
    
    /**
     * Obtém o token JWT
     */
    getToken(): string | null {
        return localStorage.getItem(this.tokenKey);
    }
    
    /**
     * Obtém o utilizador atual
     */
    getCurrentUser(): User | null {
        return this.currentUserSubject.value;
    }
    
    /**
     * Guarda a sessão no localStorage
     */
    private setSession(authData: { token: string; user: User }): void {
        localStorage.setItem(this.tokenKey, authData.token);
        localStorage.setItem(this.userKey, JSON.stringify(authData.user));
        this.currentUserSubject.next(authData.user);
        console.log('AuthService: Session saved for user:', authData.user.username);
    }
}