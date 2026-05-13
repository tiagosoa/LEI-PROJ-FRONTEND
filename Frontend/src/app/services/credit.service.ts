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
        return this.http.get<CreditResponse>(`${this.apiUrl}/vs/credit`).pipe(
            tap(response => {
                if (response.success && response.data) {
                    console.log('Credit loaded:', response.data);
                    this.creditSubject.next(response.data);
                }
            }),
            catchError((error) => {
                console.error('Error in getCredit:', error);
                this.creditSubject.next(null);
                throw error;
            })
        );
    }
    
    /**
     * Atualiza o crédito (após criar/eliminar VS)
     */
    refreshCredit(): void {
        console.log('Refreshing credit...');
        this.getCredit().subscribe();
    }
    
    /**
     * Obtém o valor atual do crédito (sem fazer nova requisição)
     */
    getCurrentCredit(): CreditInfo | null {
        return this.creditSubject.value;
    }
}