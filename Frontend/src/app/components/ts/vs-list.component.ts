import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { VSService } from '../../services/vs.service';
import { VirtualServer } from '../../models/vs.model';

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
                        🔄 Refresh
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
            
            <div *ngIf="!isLoading && vsList.length > 0" class="vs-grid">
                <div *ngFor="let vs of vsList" class="vs-card" [routerLink]="['/vs', vs.folderName]">
                    <div class="vs-card-header">
                        <h3>{{ vs.name || 'Unnamed VS' }}</h3>
                        <span class="vs-id">ID: {{ vs.id }}</span>
                    </div>
                    
                    <div class="vs-status">
                        <div class="status-badge" [class]="getStatusClass(vs)">
                            {{ getStatusLabel(vs) }}
                        </div>
                        <div class="cost-badge" [class.running]="vs.host">
                            Cost: {{ vs.cost }}
                            <span *ngIf="vs.host" class="running-multiplier">(x2 running)</span>
                        </div>
                    </div>
                    
                    <div class="vs-info">
                        <div class="info-row">
                            <span class="label">Owner:</span>
                            <span class="value">{{ vs.owner }}</span>
                        </div>
                        <div class="info-row">
                            <span class="label">Type:</span>
                            <span class="value">{{ vs.type === 1 ? 'KVM' : vs.type === 2 ? 'Docker' : 'Type ' + vs.type }}</span>
                        </div>
                        <div class="info-row">
                            <span class="label">Days to Run:</span>
                            <span class="value" [class.low]="vs.dtr < 5">{{ vs.dtr }} days left</span>
                        </div>
                        <div class="info-row" *ngIf="vs.host">
                            <span class="label">Running on:</span>
                            <span class="value">{{ vs.host }}</span>
                        </div>
                    </div>
                    
                    <div class="vs-card-footer">
                        <button class="details-btn">View Details →</button>
                    </div>
                </div>
            </div>
        </div>
    `,
    styles: [`
        .vs-list-container {
            padding: 20px;
            max-width: 1200px;
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
            background: #667eea;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            transition: background 0.2s;
        }
        
        .refresh-btn button:hover:not(:disabled) {
            background: #5a67d8;
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
            border-top: 3px solid #667eea;
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
        
        .vs-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
            gap: 20px;
        }
        
        .vs-card {
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            overflow: hidden;
            transition: transform 0.2s, box-shadow 0.2s;
            cursor: pointer;
        }
        
        .vs-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        
        .vs-card-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 16px;
        }
        
        .vs-card-header h3 {
            margin: 0 0 8px 0;
            font-size: 1.1rem;
        }
        
        .vs-id {
            font-size: 0.8rem;
            opacity: 0.9;
        }
        
        .vs-status {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 16px;
            background: #f8f9fa;
            border-bottom: 1px solid #e9ecef;
        }
        
        .status-badge {
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 0.8rem;
            font-weight: 500;
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
        
        .cost-badge {
            font-size: 0.9rem;
            font-weight: 500;
        }
        
        .cost-badge.running {
            color: #e67e22;
        }
        
        .running-multiplier {
            font-size: 0.7rem;
            color: #e67e22;
        }
        
        .vs-info {
            padding: 16px;
        }
        
        .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            font-size: 0.9rem;
        }
        
        .info-row .label {
            color: #666;
        }
        
        .info-row .value {
            color: #333;
            font-weight: 500;
        }
        
        .info-row .value.low {
            color: #e74c3c;
            font-weight: bold;
        }
        
        .vs-card-footer {
            padding: 12px 16px;
            border-top: 1px solid #e9ecef;
            text-align: right;
        }
        
        .details-btn {
            padding: 6px 12px;
            background: transparent;
            color: #667eea;
            border: 1px solid #667eea;
            border-radius: 4px;
            cursor: pointer;
            transition: all 0.2s;
        }
        
        .details-btn:hover {
            background: #667eea;
            color: white;
        }
        
        @media (max-width: 768px) {
            .vs-grid {
                grid-template-columns: 1fr;
            }
            
            .vs-list-container {
                padding: 16px;
            }
        }
    `]
})
export class VSListComponent implements OnInit {
    vsList: VirtualServer[] = [];
    isLoading = true;
    
    constructor(private vsService: VSService) {}
    
    ngOnInit(): void {
        this.loadVSList();
    }
    
    loadVSList(): void {
        this.isLoading = true;
        this.vsService.getUserVSList().subscribe({
            next: (response) => {
                this.vsList = response.data;
                this.isLoading = false;
            },
            error: (error) => {
                console.error('Error loading VS list:', error);
                this.isLoading = false;
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
        const status = vs.softStatus?.toUpperCase() || 'STOPPED';
        return status;
    }
}