import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { VirtualServerTemplate, VSTListResponse, VSTDetailsResponse } from '../models/vst.model';

@Injectable({
    providedIn: 'root'
})
export class VSTService {
    private apiUrl = '/api';
    
    constructor(private http: HttpClient) {}
    
    /**
     * Obtém a lista de VST disponíveis (ativos)
     */
    getAvailableVSTs(): Observable<VSTListResponse> {
        return this.http.get<VSTListResponse>(`${this.apiUrl}/vst`);
    }
    
    /**
     * Obtém todos os VST (apenas admin)
     */
    getAllVSTs(): Observable<VSTListResponse> {
        return this.http.get<VSTListResponse>(`${this.apiUrl}/vst/all`);
    }
    
    /**
     * Obtém detalhes de um VST específico
     */
    getVSTDetails(folderName: string): Observable<VSTDetailsResponse> {
        return this.http.get<VSTDetailsResponse>(`${this.apiUrl}/vst/${folderName}`);
    }
}