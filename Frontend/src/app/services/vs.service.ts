import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { VirtualServer, VSListResponse, VSDetailsResponse } from '../models/vs.model';

@Injectable({
    providedIn: 'root'
})
export class VSService {
    private apiUrl = 'http://localhost:3000/api';
    
    constructor(private http: HttpClient) {}
    
    /**
     * Obtém a lista de VS do utilizador autenticado
     */
    getUserVSList(): Observable<VSListResponse> {
        return this.http.get<VSListResponse>(`${this.apiUrl}/vs`);
    }
    
    /**
     * Obtém todos os VS (apenas admin)
     */
    getAllVSList(): Observable<VSListResponse> {
        return this.http.get<VSListResponse>(`${this.apiUrl}/vs/all`);
    }
    
    /**
     * Obtém detalhes de um VS específico
     * @param folderName - Nome da pasta do VS (ex: VS_1_user_123)
     */
    getVSDetails(folderName: string): Observable<VSDetailsResponse> {
        return this.http.get<VSDetailsResponse>(`${this.apiUrl}/vs/${folderName}`);
    }
}