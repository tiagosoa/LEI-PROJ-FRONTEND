import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { CreditService } from '../services/credit.service'
import { VSService } from '../services/vs.service';
import { VirtualServer } from '../models/vs.model';

@Component({
    selector: 'app-vs-list',
    standalone: true,
    imports: [CommonModule, RouterModule],
    template: `
        <div class="vs-list-container">
            <div class="header">
                <h2>My Virtual Servers</h2>
                <div class="refresh-btn">
                    <button (click)="refreshList()" [disabled]="isLoading">
                        Refresh
                    </button>
                </div>
            </div>
            
            <div *ngIf="isLoading" class="loading">
                <div class="spinner"></div>
                <p>Loading your virtual servers...</p>
            </div>
            
            <div *ngIf="!isLoading && vsList.length === 0" class="empty-state">
                <p>You don't have any virtual servers yet.</p>
                <p>Go to Templates to create your first VS!</p>
            </div>
            
            <!-- Tabela com as colunas corretas -->
            <div *ngIf="!isLoading && vsList.length > 0" class="vs-table-container">
                <table class="vs-table">
                    <thead>
                        <tr>
                            <th>VS/VST</th>
                            <th>VS/VST Name (click to manage)</th>
                            <th>Soft Status</th>
                            <th>Cost</th>
                            <th>DTR (Days To Run)</th>
                            <th>Original Template Name</th>
                            <th>Virtual Server Type</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr *ngFor="let vs of vsList">
                            <td class="vs-id-cell">VS{{ vs.id }}</td>
                            <td class="vs-name-cell">
                                <a [routerLink]="['/vs', vs.folderName]" class="vs-link">
                                    {{ vs.name || 'Unnamed VS' }}
                                </a>
                            </td>
                            <td>
                                <span class="status-badge" [class]="getStatusClass(vs)">
                                    {{ getStatusLabel(vs) }}
                                </span>
                            </td>
                            <td class="cost-cell">
                                {{ vs.cost }}
                                <span *ngIf="vs.host" class="running-multiplier">(x2 running)</span>
                            </td>
                            <td class="dtr-cell" [class.low-dtr]="vs.dtr < 5">
                                {{ vs.dtr }}
                            </td>
                            <!-- Original Template Name: usar o nome do template (vem do VST_NAME) -->
                            <td class="template-cell">
                                {{ vs.vstName || 'N/A' }}
                            </td>
                            <!-- Virtual Server Type: mostrar descrição, não o número -->
                            <td class="type-cell">
                                {{ getTypeDescription(vs) }}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    `,
    styles: [`
        .vs-list-container {
            padding: 20px;
            max-width: 1400px;
            margin: 0 auto;
        }
        
        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 24px;
        }
        
        .header h2 {
            margin: 0;
            color: #333;
        }
        
        .refresh-btn button {
            padding: 8px 16px;
            background: #6c757d;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            transition: background 0.2s;
        }
        
        .refresh-btn button:hover:not(:disabled) {
            background: #5a6268;
        }
        
        .refresh-btn button:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }
        
        .loading {
            text-align: center;
            padding: 50px;
        }
        
        .spinner {
            border: 3px solid #f3f3f3;
            border-top: 3px solid #6c757d;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 0 auto 20px;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        .empty-state {
            text-align: center;
            padding: 50px;
            background: #f5f5f5;
            border-radius: 8px;
            color: #666;
        }
        
        .vs-table-container {
            overflow-x: auto;
        }
        
        .vs-table {
            width: 100%;
            border-collapse: collapse;
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        
        .vs-table thead tr {
            background: #2c3e50;
            color: white;
        }
        
        .vs-table th {
            padding: 12px 16px;
            text-align: left;
            font-weight: 500;
        }
        
        .vs-table td {
            padding: 12px 16px;
            border-bottom: 1px solid #e9ecef;
            vertical-align: middle;
        }
        
        .vs-table tbody tr:hover {
            background: #f8f9fa;
        }
        
        .vs-id-cell {
            font-weight: 500;
            color: #6c757d;
        }
        
        .vs-name-cell .vs-link {
            color: #007bff;
            text-decoration: none;
            cursor: pointer;
        }
        
        .vs-name-cell .vs-link:hover {
            text-decoration: underline;
        }
        
        .status-badge {
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 0.75rem;
            font-weight: 500;
            display: inline-block;
        }
        
        .status-badge.running {
            background: #d4edda;
            color: #155724;
        }
        
        .status-badge.stopped {
            background: #e2e3e5;
            color: #383d41;
        }
        
        .status-badge.starting, .status-badge.stopping {
            background: #fff3cd;
            color: #856404;
        }
        
        .status-badge.error {
            background: #f8d7da;
            color: #721c24;
        }
        
        .cost-cell {
            font-weight: 500;
        }
        
        .running-multiplier {
            font-size: 0.7rem;
            color: #e67e22;
            margin-left: 4px;
        }
        
        .dtr-cell {
            font-weight: 500;
        }
        
        .dtr-cell.low-dtr {
            color: #dc3545;
            font-weight: bold;
        }
        
        .template-cell {
            color: #555;
            max-width: 200px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        
        .type-cell {
            color: #555;
        }
        
        .debug-info {
            margin-top: 20px;
            padding: 10px;
            background: #f0f0f0;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 12px;
        }
        
        .debug-raw {
            margin-top: 10px;
            padding-top: 10px;
            border-top: 1px solid #ddd;
        }
        
        .debug-raw pre {
            background: #e0e0e0;
            padding: 10px;
            border-radius: 4px;
            overflow-x: auto;
            font-size: 10px;
            margin: 5px 0 0 0;
        }
        
        @media (max-width: 768px) {
            .vs-list-container {
                padding: 16px;
            }
            
            .vs-table th, .vs-table td {
                padding: 8px 12px;
                font-size: 12px;
            }
            
            .template-cell, .type-cell {
                max-width: 120px;
            }
        }
    `]
})
export class VSListComponent implements OnInit {
    vsList: VirtualServer[] = [];
    isLoading = true;
    errorMessage: string = '';
    
    constructor(
        private vsService: VSService,
        private creditService: CreditService,
        private cdr: ChangeDetectorRef,
        private router: Router
    ) {
        this.router.events.subscribe(event => {
        if (event instanceof NavigationEnd && event.url === '/vs') {
            this.loadVSList();
        }
    });
}
    
    ngOnInit(): void {
        this.loadVSList();
    }
    
    loadVSList(): void {
        console.log('Loading VS list...');
        this.isLoading = true;
        
        this.vsService.getUserVSList().subscribe({
            next: (response) => {
                console.log('Response received:', response);
                if (response.success && response.data) {
                    this.vsList = response.data;
                    console.log('vsList updated:', this.vsList);
                    
                    // Debug: mostrar o primeiro VS em detalhe
                    if (this.vsList.length > 0) {
                        console.log('First VS details:', {
                            id: this.vsList[0].id,
                            name: this.vsList[0].name,
                            vstName: this.vsList[0].vstName,
                            type: this.vsList[0].type,
                            typeDescription: this.vsList[0].typeDescription
                        });
                    }
                }
                this.isLoading = false;
                this.cdr.detectChanges();
            },
            error: (error) => {
                console.error('Error loading VS list:', error);
                this.errorMessage = 'Failed to load virtual servers. Please try again.';
                this.isLoading = false;
                this.cdr.detectChanges();
            }
        });
    }
    
    refreshList(): void {
        this.loadVSList();
    }
    
    getStatusClass(vs: VirtualServer): string {
        const status = vs.softStatus?.toLowerCase() || 'stopped';
        if (status === 'running') return 'running';
        if (status === 'stopped') return 'stopped';
        if (status === 'starting' || status === 'stopping') return status;
        return 'error';
    }
    
    getStatusLabel(vs: VirtualServer): string {
        return (vs.softStatus?.toUpperCase() || 'STOPPED');
    }
    
    getTypeDescription(vs: VirtualServer): string {
        if (vs.typeDescription) {
            return vs.typeDescription;
        }
        const typeMap: { [key: number]: string } = {
            0: '0 - Fake/Testing',
            1: '1 - QEMU/KVM',
            2: '2 - Docker',
            7: '7 - LXC'
        };
        return typeMap[vs.type] || `Type ${vs.type}`;
    }
}