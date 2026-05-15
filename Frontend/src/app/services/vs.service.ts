import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { VirtualServer, VSListResponse, VSDetailsResponse } from '../models/vs.model';

@Injectable({
    providedIn: 'root'
})
export class VSService {
    private apiUrl = '/api';
    
    constructor(private http: HttpClient) {}
    
    /**
     * Obtém a lista de VS do utilizador autenticado (versão base, sem extended)
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
     * Obtém detalhes completos de um VS específico (com network configs e custom accesses)
     * @param folderName - Nome da pasta do VS (ex: VS_7_1231246_216)
     */
    getVSDetails(folderName: string): Observable<VSDetailsResponse> {
        return this.http.get<VSDetailsResponse>(`${this.apiUrl}/vs/${folderName}`);
    }

    /**
     * Cria um novo VS a partir de um template
     * @param vstFolderName - Nome da pasta do template (ex: VST_7_admin_100)
     */
    createVS(vstFolderName: string): Observable<any> {
        return this.http.post(`${this.apiUrl}/vs/create`, { vstFolderName });
    }

    startVS(folderName: string): Observable<any> {
        return this.http.post(`${this.apiUrl}/vs/${folderName}/start`, {});
    }
    
    stopVS(folderName: string): Observable<any> {
        return this.http.post(`${this.apiUrl}/vs/${folderName}/stop`, {});
    }
    
    deleteVS(folderName: string): Observable<any> {
        return this.http.delete(`${this.apiUrl}/vs/${folderName}`);
    }

    setAttribute(folderName: string, attributeName: string, value: string, isBase64: boolean = false): Observable<any> {
        return this.http.put(`${this.apiUrl}/vs/${folderName}/attribute`, { attributeName, value, isBase64 });
    }

    toggleAccessEnabled(folderName: string, accessId: number, enabled: boolean): Observable<any> {
        const attributeName = `CUSTOM_ACCESS${accessId}_ENABLED_DISABLED`;
        const value = enabled ? 'enabled' : 'disabled';
        return this.setAttribute(folderName, attributeName, value);
    }
}