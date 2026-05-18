import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { CreditService } from '../services/credit.service';
import { VSService } from '../services/vs.service';
import { VirtualServer } from '../models/vs.model';
import { Subscription, interval } from 'rxjs';

@Component({
    selector: 'app-vs-list',
    standalone: true,
    imports: [CommonModule, RouterModule],
    template: `
        <div class="vs-list-container">
            <div class="header">
                <h2>My Virtual Servers</h2>
            </div>
            
            <div *ngIf="isLoading" class="loading">
                <div class="spinner"></div>
                <p>Loading your virtual servers...</p>
            </div>
            
            <div *ngIf="!isLoading && vsList.length === 0" class="empty-state">
                <p>You don't have any virtual servers yet.</p>
                <p>Go to Templates to create your first VS!</p>
            </div>
            
            <!-- Grid de cards (estilo semelhante aos VST) -->
            <div *ngIf="!isLoading && vsList.length > 0" class="vs-grid">
                <div *ngFor="let vs of vsList" class="vs-card" (click)="goToDetails(vs.folderName)">
                    <div class="vs-card-header">
                        <h3>{{ vs.name || 'Unnamed VS' }}</h3>
                        <span class="vs-id">VS{{ vs.id }}</span>
                    </div>
                    
                    <div class="vs-details">
                        <div class="vs-status">
                            <span class="label">Status:</span>
                            <span class="status-badge" [class]="getStatusClass(vs)">
                                {{ getStatusLabel(vs) }}
                            </span>
                        </div>
                        <div class="vs-cost">
                            <span class="label">Cost:</span>
                            <span class="value cost-value">
                                {{ vs.cost }}
                                <span *ngIf="vs.host" class="running-multiplier">(x2 running)</span>
                            </span>
                        </div>
                        <div class="vs-dtr">
                            <span class="label">DTR:</span>
                            <span class="value" [class.low-dtr]="vs.dtr < 5">{{ vs.dtr }} days left</span>
                        </div>
                        <div class="vs-type">
                            <span class="label">Type:</span>
                            <span class="value">{{ getTypeDescription(vs) }}</span>
                        </div>
                        <div class="vs-template">
                            <span class="label">Template:</span>
                            <span class="value template-name">{{ vs.vstName || 'N/A' }}</span>
                        </div>
                    </div>
                    
                    <div class="vs-card-footer">
                        <button class="details-btn">View Details</button>
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
        
        .vs-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
            gap: 24px;
        }
        
        .vs-card {
            background: white;
            border-radius: 12px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            overflow: hidden;
            transition: transform 0.2s, box-shadow 0.2s;
            cursor: pointer;
        }
        
        .vs-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 4px 16px rgba(0,0,0,0.15);
        }
        
        .vs-card-header {
            background: #2c3e50;
            color: white;
            padding: 20px;
        }
        
        .vs-card-header h3 {
            margin: 0 0 8px 0;
            font-size: 1.2rem;
        }
        
        .vs-id {
            font-size: 0.8rem;
            opacity: 0.8;
        }
        
        .vs-details {
            padding: 16px 20px;
        }
        
        .vs-details div {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            padding-bottom: 8px;
            border-bottom: 1px solid #e9ecef;
        }
        
        .vs-details div:last-child {
            margin-bottom: 0;
            padding-bottom: 0;
            border-bottom: none;
        }
        
        .label {
            color: #666;
            font-weight: 500;
        }
        
        .value {
            color: #333;
        }
        
        .cost-value {
            color: #28a745;
            font-weight: bold;
        }
        
        .running-multiplier {
            font-size: 0.7rem;
            color: #e67e22;
            margin-left: 4px;
        }
        
        .low-dtr {
            color: #dc3545;
            font-weight: bold;
        }
        
        .status-badge {
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 0.7rem;
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
        
        .template-name {
            max-width: 180px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        
        .vs-card-footer {
            padding: 16px 20px;
            border-top: 1px solid #e9ecef;
            text-align: right;
        }
        
        .details-btn {
            padding: 6px 16px;
            background: #6c757d;
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            transition: background 0.2s;
        }
        
        .details-btn:hover {
            background: #5a6268;
        }
        
        @media (max-width: 768px) {
            .vs-list-container {
                padding: 16px;
            }
            
            .vs-grid {
                grid-template-columns: 1fr;
                gap: 16px;
            }
        }
    `]
})
export class VSListComponent implements OnInit, OnDestroy {
    vsList: VirtualServer[] = [];
    isLoading = true;
    private pollingSubscription: Subscription | null = null;
    private readonly POLLING_INTERVAL = 5000; // 5 segundos
    
    constructor(
        private vsService: VSService,
        private creditService: CreditService,
        private cdr: ChangeDetectorRef,
        private router: Router
    ) {}
    
    ngOnInit(): void {
        this.loadVSList();
        this.startPolling();
    }
    
    ngOnDestroy(): void {
        this.stopPolling();
    }
    
    startPolling(): void {
        this.pollingSubscription = interval(this.POLLING_INTERVAL).subscribe(() => {
            this.loadVSList(false); // Silencioso, sem mostrar loading
        });
    }
    
    stopPolling(): void {
        if (this.pollingSubscription) {
            this.pollingSubscription.unsubscribe();
            this.pollingSubscription = null;
        }
    }
    
    loadVSList(showLoading: boolean = true): void {
        if (showLoading) {
            this.isLoading = true;
        }
        
        this.vsService.getUserVSList().subscribe({
            next: (response) => {
                if (response.success && response.data) {
                    this.vsList = response.data;
                }
                this.isLoading = false;
                this.cdr.detectChanges();
            },
            error: (error) => {
                console.error('Error loading VS list:', error);
                this.isLoading = false;
                this.cdr.detectChanges();
            }
        });
    }
    
    goToDetails(folderName: string): void {
        this.router.navigate(['/vs', folderName]);
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
        if (vs.typeDescription && vs.typeDescription.includes(' - ')) {
            return vs.typeDescription;
        }
        const typeMap: { [key: number]: string } = {
            0: '0 - Fake/Testing',
            1: '1 - QEMU/KVM',
            2: '2 - Docker',
            3: '3 - LXD',
            4: '4 - Single application',
            5: '5 - VMware',
            6: '6 - Virtual Box',
            7: '7 - LXC',
            8: '8 - FreeBSD Jail',
            9: '9 - SYSBOX',
            10: '10 - PODMAN',
            11: '11 - INCUS'
        };
        return typeMap[vs.type] || vs.typeDescription || `Type ${vs.type}`;
    }
}