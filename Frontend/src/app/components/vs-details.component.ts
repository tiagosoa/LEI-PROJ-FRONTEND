import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { VSService } from '../services/vs.service';
import { VirtualServer, CustomAccess } from '../models/vs.model';

@Component({
    selector: 'app-vs-details',
    standalone: true,
    imports: [CommonModule, RouterModule],
    template: `
        <div class="details-container" *ngIf="!isLoading && vs; else loading">
            <div class="details-header">
                <button class="back-btn" (click)="goBack()">Back to VS List</button>
                <h1>{{ vs.name || 'Virtual Server' }}</h1>
                <div class="action-buttons">
                    <button class="action-btn start" [disabled]="vs.softStatus === 'running'" (click)="startVS()">
                        Start
                    </button>
                    <button class="action-btn stop" [disabled]="vs.softStatus !== 'running'" (click)="stopVS()">
                        Stop
                    </button>
                    <button class="action-btn delete" [disabled]="vs.softStatus === 'running'" (click)="deleteVS()">
                        Delete
                    </button>
                </div>
            </div>
            
            <!-- Status Section -->
            <div class="info-card">
                <h3>Status</h3>
                <div class="status-grid">
                    <div class="status-item">
                        <span class="label">Soft Status:</span>
                        <span class="value" [class.running]="vs.softStatus === 'running'">
                            {{ vs.softStatus | uppercase }}
                        </span>
                    </div>
                    <div class="status-item">
                        <span class="label">Hard Status:</span>
                        <span class="value" [class.running]="vs.hardStatus === 'running'">
                            {{ vs.hardStatus ? (vs.hardStatus | uppercase) : 'Unknown' }}
                        </span>
                    </div>
                    <div class="status-item" *ngIf="vs.host">
                        <span class="label">Running on Node:</span>
                        <span class="value">{{ vs.host }}</span>
                    </div>
                    <div class="status-item" *ngIf="vs.fixedHost">
                        <span class="label">Fixed Host:</span>
                        <span class="value">{{ vs.fixedHost }}</span>
                    </div>
                </div>
            </div>
            
            <!-- Basic Info Section -->
            <div class="info-card">
                <h3>Basic Information</h3>
                <div class="info-grid">
                    <div class="info-row">
                        <span class="label">VS ID:</span>
                        <span class="value">{{ vs.id }}</span>
                    </div>
                    <div class="info-row">
                        <span class="label">Owner:</span>
                        <span class="value">{{ vs.owner }}</span>
                    </div>
                    <div class="info-row">
                        <span class="label">Type:</span>
                        <span class="value">{{ vs.typeDescription }}</span>
                    </div>
                    <div class="info-row">
                        <span class="label">Cost:</span>
                        <span class="value" [class.running]="vs.host">
                            {{ vs.cost }} credits
                            <span *ngIf="vs.host" class="note">(base: {{ vs.baseCost }}, doubled while running)</span>
                        </span>
                    </div>
                    <div class="info-row">
                        <span class="label">Days to Run (DTR):</span>
                        <span class="value" [class.low]="vs.dtr < 5">{{ vs.dtr }} days remaining</span>
                    </div>
                </div>
            </div>
            
            <!-- Description Section -->
            <div class="info-card">
                <h3>Description</h3>
                <p class="description">{{ vs.description || 'No description provided.' }}</p>
            </div>
            
            <!-- Network Configuration Section -->
            <div class="info-card" *ngIf="vs.networkConfigs && vs.networkConfigs.length > 0">
                <h3>Network Configuration</h3>
                <div class="network-table">
                    <div class="network-header">
                        <span>Network</span>
                        <span>IPv4</span>
                        <span>IPv6</span>
                        <span>MAC Address</span>
                    </div>
                    <div class="network-row" *ngFor="let net of vs.networkConfigs">
                        <span class="net-name">{{ net.name }}</span>
                        <span class="net-ip">{{ net.ipv4 || '-' }}</span>
                        <span class="net-ip6">{{ net.ipv6 || '-' }}</span>
                        <span class="net-mac">{{ net.mac || '-' }}</span>
                    </div>
                </div>
            </div>
            
            <!-- Custom Access Section -->
            <div class="info-card" *ngIf="vs.customAccesses && vs.customAccesses.length > 0">
                <h3>Access Methods</h3>
                <div class="access-list">
                    <div class="access-item" *ngFor="let access of vs.customAccesses">
                        <div class="access-header">
                            <span class="access-title">Access #{{ access.id }}</span>
                            <span class="access-status" [class.enabled]="access.enabled" [class.disabled]="!access.enabled">
                                {{ access.enabled ? 'Enabled' : 'Disabled' }}
                            </span>
                        </div>
                        <div class="access-description" [innerHTML]="access.description"></div>
                        <div class="access-password" *ngIf="access.password">
                            <span class="label">Password:</span>
                            <div class="password-field">
                                <input [type]="showPassword[access.id] ? 'text' : 'password'" 
                                       [value]="access.password" 
                                       readonly
                                       #passwordInput>
                                <button (click)="togglePassword(access.id, passwordInput)">{{ showPassword[access.id] ? 'Hide' : 'Show' }}</button>
                                <button (click)="copyPassword(access.password)">Copy</button>
                            </div>
                        </div>
                        <div class="access-action" *ngIf="access.canChangePassword">
                            <button class="change-pass-btn" (click)="changePassword(access.id)">
                                 {{ access.changeDescription || 'Change Password' }}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Requirements Section -->
            <div class="info-card" *ngIf="vs.requisites && vs.requisites.length > 0">
                <h3>Node Requirements</h3>
                <div class="requisites-list">
                    <span class="requisite-tag" *ngFor="let req of vs.requisites">
                        {{ req }}
                    </span>
                </div>
            </div>
        </div>
        
        <ng-template #loading>
            <div class="loading">
                <div class="spinner"></div>
                <p>Loading virtual server details...</p>
            </div>
        </ng-template>
    `,
    // Adiciona/modifica estas classes nos styles do componente:

styles: [`
    .details-container {
        padding: 20px;
        max-width: 1200px;
        margin: 0 auto;
    }
    
    .details-header {
        margin-bottom: 24px;
    }
    
    .back-btn {
        background: none;
        border: none;
        color: #667eea;
        cursor: pointer;
        font-size: 14px;
        margin-bottom: 16px;
        padding: 0;
    }
    
    .back-btn:hover {
        text-decoration: underline;
    }
    
    .details-header h1 {
        margin: 0 0 16px 0;
        color: #333;
    }
    
    .action-buttons {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
    }
    
    .action-btn {
        padding: 8px 20px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-weight: 500;
        transition: all 0.2s;
    }
    
    .action-btn.start {
        background: #28a745;
        color: white;
    }
    
    .action-btn.start:hover:not(:disabled) {
        background: #218838;
    }
    
    .action-btn.stop {
        background: #ffc107;
        color: #333;
    }
    
    .action-btn.stop:hover:not(:disabled) {
        background: #e0a800;
    }
    
    .action-btn.delete {
        background: #dc3545;
        color: white;
    }
    
    .action-btn.delete:hover:not(:disabled) {
        background: #c82333;
    }
    
    .action-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
    
    .info-card {
        background: white;
        border-radius: 8px;
        border: 1px solid #333; 
        padding: 20px;
        margin-bottom: 20px;
        transition: border-color 0.2s;
    }
    
    .info-card:hover {
        border-color: #626161;
    }
    
    .info-card h3 {
        margin: 0 0 16px 0;
        color: #333;
        border-bottom: 2px solid #667eea;
        padding-bottom: 8px;
    }
    
    /* Sub-blocks dentro dos cards também com borders */
    .status-grid, .info-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 12px;
    }
    
    .status-item, .info-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 0;
        border-bottom: 1px solid #333;
    }
    
    .status-item:last-child, .info-row:last-child {
        border-bottom: none;
    }
    
    .network-table {
        display: flex;
        flex-direction: column;
        border: 1px solid #333; 
        border-radius: 8px;
        overflow: hidden;
    }
    
    .network-header, .network-row {
        display: grid;
        grid-template-columns: 100px 1fr 1fr 1fr;
        gap: 12px;
        padding: 10px;
    }
    
    .network-header {
        background: #c7c8c9;
        font-weight: 500;
        border-bottom: 1px solid #333;
    }
    
    .network-row {
        border-bottom: 1px solid #333;
    }
    
    .network-row:last-child {
        border-bottom: none;
    }
    
    /* Access items com borders */
    .access-list {
        display: flex;
        flex-direction: column;
        gap: 20px;
    }
    
    .access-item {
        border: 1px solid #333;
        border-radius: 8px;
        padding: 16px;
        transition: border-color 0.2s;
    }
    
    .access-item:hover {
        border-color: #444;
    }
    
    .access-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
        padding-bottom: 8px;
        border-bottom: 1px solid #333;
    }
    
    .access-title {
        font-weight: 500;
        color: #333;
    }
    
    .access-status {
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 0.75rem;
    }
    
    .access-status.enabled {
        background: #d4edda;
        color: #155724;
    }
    
    .access-status.disabled {
        background: #f8d7da;
        color: #721c24;
    }
    
    .access-description {
        color: #555;
        margin-bottom: 12px;
        font-size: 0.9rem;
    }
    
    .access-description ::ng-deep a {
        color: #667eea;
        text-decoration: none;
    }
    
    .access-description ::ng-deep a:hover {
        text-decoration: underline;
    }
    
    .password-field {
        display: flex;
        gap: 8px;
        align-items: center;
        margin-top: 8px;
        padding: 8px;
        border: 1px solid #333;
        border-radius: 4px;
        background: #f9f9f9;
    }
    
    .password-field input {
        flex: 1;
        padding: 6px 10px;
        border: 1px solid #444;
        border-radius: 4px;
        background: #f8f9fa;
        font-family: monospace;
    }
    
    .password-field button {
        padding: 6px 12px;
        background: #667eea;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
    }
    
    .password-field button:hover {
        background: #5a67d8;
    }
    
    .change-pass-btn {
        margin-top: 12px;
        padding: 6px 12px;
        background: #6c757d;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
    }
    
    .change-pass-btn:hover {
        background: #5a6268;
    }
    
    .requisites-list {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
    }
    
    .requisite-tag {
        background: #e9ecef;
        padding: 4px 12px;
        border-radius: 16px;
        font-size: 0.8rem;
        color: #495057;
        border: 1px solid #333; 
    }
    
    .label {
        font-weight: 500;
        color: #666;
    }
    
    .value {
        color: #333;
    }
    
    .value.running {
        color: #28a745;
        font-weight: bold;
    }
    
    .value.low {
        color: #dc3545;
        font-weight: bold;
    }
    
    .note {
        font-size: 0.8rem;
        color: #666;
        margin-left: 8px;
    }
    
    .description {
        color: #555;
        line-height: 1.6;
        margin: 0;
        white-space: pre-wrap;
        padding: 12px;
        border: 1px solid #333;
        border-radius: 8px;
        background: #fafafa62;
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
    
    @media (max-width: 768px) {
        .details-container {
            padding: 16px;
        }
        
        .network-header, .network-row {
            grid-template-columns: 80px 1fr;
            gap: 8px;
        }
        
        .network-header span:nth-child(3),
        .network-header span:nth-child(4),
        .network-row span:nth-child(3),
        .network-row span:nth-child(4) {
            display: none;
        }
        
        .status-grid, .info-grid {
            grid-template-columns: 1fr;
        }
        
        .action-buttons {
            justify-content: center;
        }
        }
    `]
})
export class VSDetailsComponent implements OnInit {
    vs: VirtualServer | null = null;
    isLoading = true;
    errorMessage: string = '';
    showPassword: { [key: number]: boolean } = {};
    
    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private vsService: VSService,
        private cdr: ChangeDetectorRef
    ) {}
    
    ngOnInit(): void {
        console.log('VSDetailsComponent initialized');
        this.route.params.subscribe(params => {
            const folderName = params['folderName'];
            console.log('Folder name from route:', folderName);
            if (folderName) {
                this.loadVSDetails(folderName);
            } else {
                console.error('No folderName in route params');
                this.errorMessage = 'No virtual server specified';
                this.isLoading = false;
                this.cdr.detectChanges();
            }
        });
    }
    
    loadVSDetails(folderName: string): void {
        console.log('Loading VS details for:', folderName);
        this.isLoading = true;
        this.cdr.detectChanges();
        
        this.vsService.getVSDetails(folderName).subscribe({
            next: (response) => {
                console.log('VS details response:', response);
                if (response.success && response.data) {
                    this.vs = response.data;
                    console.log('VS details loaded:', this.vs);
                } else {
                    this.errorMessage = 'Failed to load virtual server details';
                }
                this.isLoading = false;
                this.cdr.detectChanges();
            },
            error: (error) => {
                console.error('Error loading VS details:', error);
                this.errorMessage = `Error: ${error.message || 'Failed to load details'}`;
                this.isLoading = false;
                this.cdr.detectChanges();
            }
        });
    }
    
    goBack(): void {
        this.router.navigate(['/vs']);
    }
    
    startVS(): void {
        console.log('Start VS:', this.vs?.folderName);
        // TODO: Implementar na US6
    }
    
    stopVS(): void {
        console.log('Stop VS:', this.vs?.folderName);
        // TODO: Implementar na US7
    }
    
    deleteVS(): void {
        if (confirm('Are you sure you want to delete this virtual server? This action cannot be undone.')) {
            console.log('Delete VS:', this.vs?.folderName);
            // TODO: Implementar na US8
        }
    }
    
    togglePassword(accessId: number, inputElement: HTMLInputElement): void {
        this.showPassword[accessId] = !this.showPassword[accessId];
        setTimeout(() => {
            inputElement.type = this.showPassword[accessId] ? 'text' : 'password';
        }, 0);
    }
    
    copyPassword(password: string): void {
        navigator.clipboard.writeText(password);
        alert('Password copied to clipboard!');
    }
    
    changePassword(accessId: number): void {
        console.log('Change password for access:', accessId);
        // TODO: Implementar na US9
    }
}