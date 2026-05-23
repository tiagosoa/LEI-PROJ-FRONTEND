import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { CreditInfo, CreditResponse } from '../models/credit.model';

@Injectable({
    providedIn: 'root'
})
export class CreditService {
    private apiUrl = '/api';
    private creditSubject = new BehaviorSubject<CreditInfo | null>(null);
    public credit$ = this.creditSubject.asObservable();
    
    constructor(private http: HttpClient) {}
    
    /**
     * Obtém o crédito do utilizador
     */
    getCredit(): Observable<CreditResponse> {
        console.log('CreditService: Fetching credit...');
        return this.http.get<CreditResponse>(`${this.apiUrl}/vs/credit`).pipe(
            tap(response => {
                if (response.success && response.data) {
                    console.log('CreditService: Credit loaded:', response.data);
                    this.creditSubject.next(response.data);
                } else {
                    console.log('CreditService: Credit response invalid:', response);
                }
            }),
            catchError((error) => {
                console.error('CreditService: Error in getCredit:', error);
                return this.http.get<CreditResponse>(`${this.apiUrl}/vs/credit`).pipe(
                    tap(retryResponse => {
                        if (retryResponse.success && retryResponse.data) {
                            this.creditSubject.next(retryResponse.data);
                        }
                    })
                );
            })
        );
    }
    
    /**
     * Atualiza o crédito (após criar/eliminar VS)
     */
    refreshCredit(): void {
        console.log('CreditService: Refreshing credit...');
        this.getCredit().subscribe({
            next: () => console.log('CreditService: Credit refreshed'),
            error: (err) => console.error('CreditService: Error refreshing credit:', err)
        });
    }
    
    /**
     * Obtém o valor atual do crédito (sem fazer nova requisição)
     */
    getCurrentCredit(): CreditInfo | null {
        return this.creditSubject.value;
    }
    
    /**
     * Força a atualização imediata do crédito
     */
    forceRefresh(): void {
        console.log('CreditService: Forcing credit refresh...');
        this.creditSubject.next(null);
        this.getCredit().subscribe();
    }
}