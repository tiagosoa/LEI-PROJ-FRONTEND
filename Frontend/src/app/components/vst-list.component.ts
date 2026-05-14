import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { VSTService } from '../services/vst.service';
import { VirtualServerTemplate } from '../models/vst.model';
import { CreditService } from '../services/credit.service';
import { VSService } from '../services/vs.service';

@Component({
    selector: 'app-vst-list',
    standalone: true,
    imports: [CommonModule, RouterModule],
    template: `
        <div class="vst-list-container">
            <div class="header">
                <h2>Available Virtual Server Templates</h2>
                <div class="refresh-btn">
                    <button (click)="refreshList()" [disabled]="isLoading">
                        Refresh
                    </button>
                </div>
            </div>
            
            <div *ngIf="isLoading" class="loading">
                <div class="spinner"></div>
                <p>Loading templates...</p>
            </div>
            
            <div *ngIf="!isLoading && vstList.length === 0" class="empty-state">
                <p>No templates available at this time.</p>
                <p>Please check back later.</p>
            </div>
            
            <div *ngIf="!isLoading && vstList.length > 0" class="vst-grid">
                <div *ngFor="let vst of vstList" class="vst-card">
                    <div class="vst-card-header">
                        <h3>{{ vst.name }}</h3>
                        <span class="vst-id">ID: {{ vst.id }}</span>
                    </div>
                    
                    <div class="vst-details">
                        <div class="vst-cost">
                            <span class="label">Cost:</span>
                            <span class="value cost-value">{{ vst.cost }} credits</span>
                        </div>
                        <div class="vst-type">
                            <span class="label">Type:</span>
                            <span class="value">{{ vst.typeDescription }}</span>
                        </div>
                    </div>
                    
                    <!-- Imagens/Logos/Preview do VST (se existirem no html) -->
                    <div class="vst-preview" [innerHTML]="vst.html || ''">
                    </div>
                    
                    <div class="vst-card-footer">
                        <button class="description-btn" (click)="openDescriptionModal(vst)" [disabled]="isLoading">
                            View Description
                        </button>
                        <button class="create-btn" (click)="createVS(vst)" [disabled]="creatingVS">
                            {{ creatingVS ? 'Creating...' : 'Create Virtual Server from this template' }}
                        </button>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Modal de Descrição -->
        <div class="modal-overlay" *ngIf="selectedVST" (click)="closeDescriptionModal()">
            <div class="modal-content" (click)="$event.stopPropagation()">
                <div class="modal-header">
                    <h3>{{ selectedVST.name }}</h3>
                    <button class="modal-close" (click)="closeDescriptionModal()">&times;</button>
                </div>
                <div class="modal-body" [innerHTML]="selectedVST.description || selectedVST.html || 'No description available'">
                </div>
                <div class="modal-footer">
                    <button class="modal-close-btn" (click)="closeDescriptionModal()">Close</button>
                </div>
            </div>
        </div>
    `,
    styles: [`
        .vst-list-container {
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
            background: #6c757d;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
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
        
        .vst-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
            gap: 24px;
        }
        
        .vst-card {
            background: white;
            border-radius: 12px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            overflow: hidden;
            transition: transform 0.2s, box-shadow 0.2s;
            display: flex;
            flex-direction: column;
        }
        
        .vst-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 4px 16px rgba(0,0,0,0.15);
        }
        
        .vst-card-header {
            background: #2c3e50;
            color: white;
            padding: 20px;
        }
        
        .vst-card-header h3 {
            margin: 0 0 8px 0;
            font-size: 1.2rem;
        }
        
        .vst-id {
            font-size: 0.8rem;
            opacity: 0.8;
        }
        
        .vst-details {
            padding: 16px 20px;
            background: #f8f9fa;
            border-bottom: 1px solid #e9ecef;
        }
        
        .vst-details div {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
        }
        
        .vst-details div:last-child {
            margin-bottom: 0;
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
        
        .vst-preview {
            padding: 20px;
            flex: 1;
            min-height: 100px;
        }
        
        .vst-preview ::ng-deep img {
            max-width: 100%;
            height: auto;
            border-radius: 4px;
        }
        
        .vst-preview ::ng-deep p {
            margin: 0 0 8px 0;
            color: #555;
            font-size: 0.85rem;
            line-height: 1.4;
        }
        
        .vst-card-footer {
            padding: 16px 20px;
            border-top: 1px solid #e9ecef;
            display: flex;
            gap: 12px;
            justify-content: space-between;
        }
        
        .description-btn {
            flex: 1;
            padding: 10px;
            background: #6c757d;
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 500;
            transition: background 0.2s;
        }
        
        .description-btn:hover {
            background: #5a6268;
        }
        
        .create-btn {
            flex: 2;
            padding: 10px;
            background: #28a745;
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 500;
            transition: background 0.2s;
        }
        
        .create-btn:hover {
            background: #218838;
        }
        
        /* Modal Styles */
        .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
        }
        
        .modal-content {
            background: white;
            border-radius: 12px;
            max-width: 700px;
            width: 90%;
            max-height: 80vh;
            display: flex;
            flex-direction: column;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        }
        
        .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 20px 24px;
            border-bottom: 1px solid #e9ecef;
            background: #2c3e50;
            color: white;
            border-radius: 12px 12px 0 0;
        }
        
        .modal-header h3 {
            margin: 0;
            font-size: 1.2rem;
        }
        
        .modal-close {
            background: none;
            border: none;
            color: white;
            font-size: 28px;
            cursor: pointer;
            line-height: 1;
            padding: 0;
            margin: 0;
        }
        
        .modal-close:hover {
            opacity: 0.8;
        }
        
        .modal-body {
            padding: 24px;
            overflow-y: auto;
            flex: 1;
            color: #333;
            line-height: 1.6;
            white-space: pre-wrap;
        }
        
        .modal-body ::ng-deep a {
            color: #007bff;
            text-decoration: none;
        }
        
        .modal-body ::ng-deep a:hover {
            text-decoration: underline;
        }
        
        .modal-body ::ng-deep ul,
        .modal-body ::ng-deep ol {
            padding-left: 20px;
        }
        
        .modal-footer {
            padding: 16px 24px;
            border-top: 1px solid #e9ecef;
            text-align: right;
            background: #f8f9fa;
            border-radius: 0 0 12px 12px;
        }
        
        .modal-close-btn {
            padding: 8px 24px;
            background: #6c757d;
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
        }
        
        .modal-close-btn:hover {
            background: #5a6268;
        }
        
        @media (max-width: 768px) {
            .vst-list-container {
                padding: 16px;
            }
            
            .vst-grid {
                grid-template-columns: 1fr;
                gap: 16px;
            }
            
            .vst-card-footer {
                flex-direction: column;
            }
            
            .description-btn, .create-btn {
                width: 100%;
            }
            
            .modal-content {
                width: 95%;
                max-height: 90vh;
            }
        }
    `]
})
export class VSTListComponent implements OnInit {
    vstList: VirtualServerTemplate[] = [];
    isLoading = true;
    selectedVST: VirtualServerTemplate | null = null;
    creatingVS: boolean = false;
    
    constructor(
    private vstService: VSTService,
    private vsService: VSService,
    private creditService: CreditService,
    private router: Router,
    private cdr: ChangeDetectorRef
    ) {}
    
    ngOnInit(): void {
        this.loadVSTList();
    }
    
    loadVSTList(): void {
        this.isLoading = true;
        
        this.vstService.getAvailableVSTs().subscribe({
            next: (response) => {
                if (response.success && response.data) {
                    this.vstList = response.data;
                    console.log('VSTs loaded:', this.vstList.length);
                }
                this.isLoading = false;
                this.cdr.detectChanges();
            },
            error: (error) => {
                console.error('Error loading VST list:', error);
                this.isLoading = false;
                this.cdr.detectChanges();
            }
        });
    }
    
    refreshList(): void {
        this.loadVSTList();
    }
    
    openDescriptionModal(vst: VirtualServerTemplate): void {
        this.selectedVST = vst;
        this.cdr.detectChanges();
    }
    
    closeDescriptionModal(): void {
        this.selectedVST = null;
        this.cdr.detectChanges();
    }


    createVS(vst: VirtualServerTemplate): void {
        if (confirm(`Create a new virtual server from template "${vst.name}"?`)) {
            this.creatingVS = true;
            this.cdr.detectChanges();
            
            this.vsService.createVS(vst.folderName).subscribe({
                next: (response) => {
                    if (response.success) {
                        alert(`Virtual server created successfully!`);
                        this.creditService.refreshCredit();
                        this.router.navigate(['/vs']);
                    }
                    this.creatingVS = false;
                    this.cdr.detectChanges();
                },
                error: (error) => {
                    console.error('Error creating VS:', error);
                    if (error.status === 403 && error.error?.error === 'Insufficient credit') {
                        const credit = error.error?.credit;
                        alert(`Insufficient credit! You need ${vst.cost} credits but only have ${credit?.available || 0} available.`);
                    } else {
                        alert(`Failed to create virtual server: ${error.error?.error || 'Unknown error'}`);
                    }
                    this.creatingVS = false;
                    this.cdr.detectChanges();
                }
            });
        }
    }
}