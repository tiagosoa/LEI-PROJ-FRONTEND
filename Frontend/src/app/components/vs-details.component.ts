import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { VSService } from '../services/vs.service';
import { CreditService } from '../services/credit.service';
import { VirtualServer, CustomAccess } from '../models/vs.model';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-vs-details',
    standalone: true,
    imports: [CommonModule, RouterModule, FormsModule],
    template: `
        <div class="details-container" *ngIf="!isLoading && vs; else loading">
            <div class="details-header">
                <button class="back-btn" (click)="goBack()">Back to VS List</button>
                <h1>{{ vs.name || 'Virtual Server' }}</h1>
                <div class="action-buttons">
                    <button class="action-btn start" 
                            [disabled]="vs.softStatus === 'running' || isActionInProgress" 
                            (click)="startVS()">
                        {{ isStarting ? 'Starting...' : 'Start' }}
                    </button>
                    <button class="action-btn stop" 
                            [disabled]="vs.softStatus !== 'running' || isActionInProgress" 
                            (click)="stopVS()">
                        {{ isStopping ? 'Stopping...' : 'Stop' }}
                    </button>
                    <button class="action-btn delete" 
                            [disabled]="vs.softStatus === 'running' || isActionInProgress" 
                            (click)="deleteVS()">
                        {{ isDeleting ? 'Deleting...' : 'Delete' }}
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
                        <span class="value">{{ getTypeDisplay(vs) }}</span>
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
                    <div class="info-row">
                        <span class="label">Name:</span>
                        <span class="value editable-value">
                            <span *ngIf="!isEditingName">{{ vs.name }}</span>
                            <input *ngIf="isEditingName" 
                                   [(ngModel)]="editingNameValue" 
                                   class="edit-input"
                                   (keyup.enter)="saveName()"
                                   (keyup.escape)="cancelEditName()"
                                   autofocus>
                            <button *ngIf="!isEditingName" class="edit-icon" (click)="startEditName()" title="Edit name">✏️</button>
                            <button *ngIf="isEditingName" class="save-icon" (click)="saveName()" [disabled]="isSaving">💾</button>
                            <button *ngIf="isEditingName" class="cancel-icon" (click)="cancelEditName()">✖️</button>
                        </span>
                    </div>
                </div>
            </div>

            <!-- Description Section-->
            <div class="info-card">
                <h3>Description</h3>
                <div class="description-container">
                    <div class="description-column">
                        <div class="description-header">
                            <strong>VS Description (editable)</strong>
                            <button *ngIf="!isEditingDescription" class="edit-icon-small" (click)="startEditDescription()">✏️ Edit</button>
                        </div>
                        <div *ngIf="!isEditingDescription" class="description-content">
                            {{ vs.description || 'No description provided.' }}
                        </div>
                        <div *ngIf="isEditingDescription" class="description-edit">
                            <textarea [(ngModel)]="editingDescriptionValue" 
                                      rows="10" 
                                      class="edit-textarea"
                                      placeholder="Enter description..."></textarea>
                            <div class="edit-actions">
                                <button class="save-btn" (click)="saveDescription()" [disabled]="isSaving">Save</button>
                                <button class="cancel-btn" (click)="cancelEditDescription()">Cancel</button>
                            </div>
                        </div>
                    </div>
                    <div class="description-column">
                        <div class="description-header">
                            <strong>Original Template Description (read-only)</strong>
                        </div>
                        <div class="description-content read-only">
                            {{ vs.vstDescription || 'No template description available.' }}
                        </div>
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
                            <div class="access-controls">
                                <button class="toggle-btn" 
                                        [class.enabled]="access.enabled" 
                                        [class.disabled]="!access.enabled"
                                        (click)="toggleAccess(access.id, !access.enabled)"
                                        [disabled]="isTogglingAccess[access.id]">
                                    {{ isTogglingAccess[access.id] ? 'Updating...' : (access.enabled ? 'Disable' : 'Enable') }}
                                </button>
                            </div>
                        </div>
                        <div class="access-description" [innerHTML]="cleanAccessDescription(access.description)"></div>
                        
                        <!-- Password Section -->
                        <div class="access-password-section" *ngIf="access.password">
                            <div class="password-label">Password:</div>
                            <div class="password-field" [class.disabled]="!access.enabled">
                                <input [type]="showPassword[access.id] ? 'text' : 'password'" 
                                       [value]="access.password" 
                                       readonly
                                       #passwordInput>
                                <button (click)="togglePassword(access.id, passwordInput)">{{ showPassword[access.id] ? 'Hide' : 'Show' }}</button>
                                <button (click)="copyPassword(access.password)">Copy</button>
                            </div>
                            <div *ngIf="!access.enabled" class="disabled-warning">
                                Access is disabled - password is not usable
                            </div>
                        </div>
                        
                        <div class="access-action" *ngIf="access.canChangePassword">
                            <button class="change-pass-btn" (click)="openPasswordModal(access.id)">
                                {{ access.changeDescription || 'Change Password' }}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Change password -->
            <div class="modal-overlay" *ngIf="showPasswordModal" (click)="closePasswordModal()">
                <div class="modal-content" (click)="$event.stopPropagation()">
                    <div class="modal-header">
                        <h3>{{ selectedAccess?.changeDescription || 'Change Password' }}</h3>
                        <button class="modal-close" (click)="closePasswordModal()">&times;</button>
                    </div>
                    <div class="modal-body">
                        <label>New Password:</label>
                        <input type="password" [(ngModel)]="newPassword" class="password-input-modal" placeholder="Enter new password">
                        <label style="margin-top: 12px;">Confirm Password:</label>
                        <input type="password" [(ngModel)]="confirmPassword" class="password-input-modal" placeholder="Confirm new password">
                    </div>
                    <div class="modal-footer">
                        <button class="save-btn" (click)="saveNewPassword()" [disabled]="!newPassword || newPassword !== confirmPassword || isSaving">
                            {{ isSaving ? 'Saving...' : 'Save' }}
                        </button>
                        <button class="cancel-btn" (click)="closePasswordModal()">Cancel</button>
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

    .access-controls {
        display: flex;
        align-items: center;
        gap: 12px;
    }
    
    .access-title {
        font-weight: 500;
        color: #333;
    }
    
    .access-status {
        padding: 4px 12px;
        border-radius: 20px;
        font-size: 0.7rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }

    .access-status.enabled {
        background: #d4edda;
        color: #155724;
        border: 1px solid #c3e6cb;
    }

    .access-status.disabled {
        background: #f8d7da;
        color: #721c24;
        border: 1px solid #f5c6cb;
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
    
    .toggle-btn {
        padding: 4px 12px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.75rem;
        font-weight: 500;
        transition: all 0.2s;
    }

    .toggle-btn.enabled {
        background: #dc3545;
        color: white;
    }

    .toggle-btn.enabled:hover:not(:disabled) {
        background: #c82333;
    }

    .toggle-btn.disabled {
        background: #28a745;
        color: white;
    }

    .toggle-btn.disabled:hover:not(:disabled) {
        background: #218838;
    }

    .toggle-btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }

    .access-status {
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 0.7rem;
        font-weight: 500;
    }

    .access-status.enabled {
        background: #d4edda;
        color: #155724;
    }

    .access-status.disabled {
        background: #f8d7da;
        color: #721c24;
    }

    .password-field.disabled {
        background: #e9ecef;
    }

    .password-field.disabled input:disabled {
        background: #e9ecef;
        cursor: not-allowed;
    }

    .disabled-note {
        font-size: 0.7rem;
        color: #6c757d;
        margin-left: 8px;
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
    
    .editable-value {
        display: flex;
        align-items: center;
        gap: 8px;
    }   

    .edit-input {
        padding: 6px 10px;
        border: 1px solid #333;
        border-radius: 4px;
        font-size: 14px;
        width: 200px;
    }   

    .edit-icon, .save-icon, .cancel-icon {
        background: none;
        border: none;
        cursor: pointer;
        font-size: 16px;
        padding: 0 4px;
    }   

    .edit-icon:hover { opacity: 0.7; }
    .save-icon { color: #28a745; }
    .cancel-icon { color: #dc3545; }    

    .description-container {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 20px;
    }   

    .description-column {
        border: 1px solid #333;
        border-radius: 8px;
        overflow: hidden;
    }   

    .description-header {
        background: #f8f9fa;
        padding: 12px 16px;
        border-bottom: 1px solid #333;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }   

    .edit-icon-small {
        background: none;
        border: none;
        cursor: pointer;
        color: #667eea;
        font-size: 12px;
    }   

    .edit-icon-small:hover {
        text-decoration: underline;
    }   

    .description-content {
        padding: 16px;
        line-height: 1.6;
        white-space: pre-wrap;
        min-height: 150px;
    }   

    .description-content.read-only {
        background: #fafafa;
        color: #666;
    }   

    .description-edit {
        padding: 16px;
    }   

    .edit-textarea {
        width: 100%;
        padding: 8px;
        border: 1px solid #333;
        border-radius: 4px;
        font-family: monospace;
        font-size: 13px;
        resize: vertical;
    }   

    .edit-actions {
        margin-top: 12px;
        display: flex;
        gap: 8px;
    }   

    .save-btn {
        background: #28a745;
        color: white;
        border: none;
        padding: 6px 16px;
        border-radius: 4px;
        cursor: pointer;
    }   

    .save-btn:hover:not(:disabled) {
        background: #218838;
    }   

    .save-btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }   

    .cancel-btn {
        background: #6c757d;
        color: white;
        border: none;
        padding: 6px 16px;
        border-radius: 4px;
        cursor: pointer;
    }   

    .cancel-btn:hover {
        background: #5a6268;
    }

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
        max-width: 450px;
        width: 90%;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    }   

    .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px 20px;
        border-bottom: 1px solid #e9ecef;
        background: #2c3e50;
        color: white;
        border-radius: 12px 12px 0 0;
    }   

    .modal-header h3 {
        margin: 0;
        font-size: 1.1rem;
    }   

    .modal-close {
        background: none;
        border: none;
        color: white;
        font-size: 24px;
        cursor: pointer;
        line-height: 1;
        padding: 0;
        margin: 0;
    }   

    .modal-close:hover {
        opacity: 0.8;
    }   

    .modal-body {
        padding: 20px;
    }   

    .modal-body label {
        display: block;
        margin-bottom: 5px;
        color: #555;
        font-weight: 500;
    }   

    .password-input-modal {
        width: 100%;
        padding: 10px;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 14px;
        box-sizing: border-box;
    }   

    .password-input-modal:focus {
        outline: none;
        border-color: #667eea;
    }   

    .modal-footer {
        padding: 16px 20px;
        border-top: 1px solid #e9ecef;
        text-align: right;
        background: #f8f9fa;
        border-radius: 0 0 12px 12px;
        display: flex;
        gap: 10px;
        justify-content: flex-end;
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
    actionMessage: string = '';
    isError: boolean = false;
    isActionInProgress: boolean = false;
    isStarting: boolean = false;
    isStopping: boolean = false;
    isDeleting: boolean = false;
    isEditingName: boolean = false;
    isEditingDescription: boolean = false;
    editingNameValue: string = '';
    editingDescriptionValue: string = '';
    isSaving: boolean = false;
    showPasswordModal: boolean = false;
    selectedAccessId: number = 0;
    selectedAccess: any = null;
    newPassword: string = '';
    confirmPassword: string = '';
    isTogglingAccess: { [key: number]: boolean } = {};  
    
    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private vsService: VSService,
        private creditService: CreditService,
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
        this.isLoading = true;
        this.cdr.detectChanges();

        this.vsService.getVSDetails(folderName).subscribe({
            next: (response) => {
                if (response.success && response.data) {
                    this.vs = response.data;
                } else {
                    // VS não encontrado
                    this.handleNotFound();
                }
                this.isLoading = false;
                this.cdr.detectChanges();
            },
            error: (error) => {
                console.error('Error loading VS details:', error);
                this.handleNotFound();
            }
        });
    }
    getTypeDisplay(vs: VirtualServer): string {
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

    private handleNotFound(): void {
        alert('Virtual server not found or has been deleted.');
        this.router.navigate(['/vs']);
    }
    
    goBack(): void {
        this.router.navigate(['/vs']);
    }
    
    startVS(): void {
        if (!this.vs) return;
        
        this.isStarting = true;
        this.isActionInProgress = true;
        this.actionMessage = '';
        this.isError = false;
        this.cdr.detectChanges();
        
        this.vsService.startVS(this.vs.folderName).subscribe({
            next: (response) => {
                this.actionMessage = 'Virtual server started successfully!';
                this.isError = false;
                // Recarregar detalhes para atualizar o estado
                setTimeout(() => {
                    this.loadVSDetails(this.vs!.folderName);
                    // Atualizar crédito (o custo duplica quando running)
                    this.creditService.refreshCredit();
                }, 2000);
                this.isStarting = false;
                this.isActionInProgress = false;
                this.cdr.detectChanges();
            },
            error: (error) => {
                this.actionMessage = error.error?.error || 'Failed to start virtual server';
                this.isError = true;
                this.isStarting = false;
                this.isActionInProgress = false;
                this.cdr.detectChanges();
                setTimeout(() => {
                    this.actionMessage = '';
                    this.cdr.detectChanges();
                }, 5000);
            }
        });
    }
    
    stopVS(): void {
        if (!this.vs) return;
        
        this.isStopping = true;
        this.isActionInProgress = true;
        this.actionMessage = '';
        this.isError = false;
        this.cdr.detectChanges();
        
        this.vsService.stopVS(this.vs.folderName).subscribe({
            next: (response) => {
                this.actionMessage = 'Virtual server stopped successfully!';
                this.isError = false;
                setTimeout(() => {
                    this.loadVSDetails(this.vs!.folderName);
                    this.creditService.refreshCredit();
                }, 2000);
                this.isStopping = false;
                this.isActionInProgress = false;
                this.cdr.detectChanges();
            },
            error: (error) => {
                this.actionMessage = error.error?.error || 'Failed to stop virtual server';
                this.isError = true;
                this.isStopping = false;
                this.isActionInProgress = false;
                this.cdr.detectChanges();
                
                setTimeout(() => {
                    this.actionMessage = '';
                    this.cdr.detectChanges();
                }, 5000);
            }
        });
    }
    
    deleteVS(): void {
        if (!this.vs) return;

        const confirmDelete = confirm(`Are you sure you want to delete "${this.vs.name}"? This action cannot be undone.`);

        if (!confirmDelete) return;

        this.isDeleting = true;
        this.isActionInProgress = true;
        this.actionMessage = '';
        this.isError = false;
        this.cdr.detectChanges();

        this.vsService.deleteVS(this.vs.folderName).subscribe({
            next: () => {
                this.actionMessage = 'Virtual server deleted successfully! Redirecting...';
                this.isError = false;

                // Atualizar crédito
                this.creditService.refreshCredit();
                this.vs = null;

                setTimeout(() => {
                    // Usar replaceUrl para não manter a página apagada no histórico
                    this.router.navigate(['/vs'], { replaceUrl: true });
                }, 1500);

                this.isDeleting = false;
                this.isActionInProgress = false;
                this.cdr.detectChanges();
            },
            error: (error) => {
                this.actionMessage = error.error?.error || 'Failed to delete virtual server';
                this.isError = true;
                this.isDeleting = false;
                this.isActionInProgress = false;
                this.cdr.detectChanges();

                setTimeout(() => {
                    this.actionMessage = '';
                    this.cdr.detectChanges();
                }, 5000);
            }
        });
    }

    startEditName(): void {
        if (!this.vs) return;
        this.editingNameValue = this.vs.name || '';
        this.isEditingName = true;
        this.cdr.detectChanges();
    }

    cancelEditName(): void {
        this.isEditingName = false;
        this.editingNameValue = '';
        this.cdr.detectChanges();
    }

    saveName(): void {
        if (!this.vs || !this.editingNameValue.trim()) return;

        this.isSaving = true;
        this.cdr.detectChanges();

        this.vsService.setAttribute(this.vs.folderName, 'VS_NAME', this.editingNameValue.trim()).subscribe({
            next: () => {
                this.vs!.name = this.editingNameValue.trim();
                this.isEditingName = false;
                this.isSaving = false;
                this.actionMessage = 'Name updated successfully!';
                this.isError = false;
                this.cdr.detectChanges();

                setTimeout(() => {
                    this.actionMessage = '';
                    this.cdr.detectChanges();
                }, 3000);
            },
            error: (error) => {
                this.actionMessage = error.error?.error || 'Failed to update name';
                this.isError = true;
                this.isSaving = false;
                this.cdr.detectChanges();

                setTimeout(() => {
                    this.actionMessage = '';
                    this.cdr.detectChanges();
                }, 5000);
            }
        });
    }

    startEditDescription(): void {
        if (!this.vs) return;
        this.editingDescriptionValue = this.vs.description || '';
        this.isEditingDescription = true;
        this.cdr.detectChanges();
    }

    cancelEditDescription(): void {
        this.isEditingDescription = false;
        this.editingDescriptionValue = '';
        this.cdr.detectChanges();
    }

    saveDescription(): void {
        if (!this.vs) return;

        this.isSaving = true;
        this.cdr.detectChanges();

        this.vsService.setAttribute(this.vs.folderName, 'VS_DESC', this.editingDescriptionValue || '').subscribe({
            next: () => {
                this.vs!.description = this.editingDescriptionValue || '';
                this.isEditingDescription = false;
                this.isSaving = false;
                this.actionMessage = 'Description updated successfully!';
                this.isError = false;
                this.cdr.detectChanges();

                setTimeout(() => {
                    this.actionMessage = '';
                    this.cdr.detectChanges();
                }, 3000);
            },
            error: (error) => {
                this.actionMessage = error.error?.error || 'Failed to update description';
                this.isError = true;
                this.isSaving = false;
                this.cdr.detectChanges();

                setTimeout(() => {
                    this.actionMessage = '';
                    this.cdr.detectChanges();
                }, 5000);
            }
        });
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

    openPasswordModal(accessId: number): void {
        this.selectedAccessId = accessId;
        this.selectedAccess = this.vs?.customAccesses?.find(a => a.id === accessId);
        this.newPassword = '';
        this.confirmPassword = '';
        this.showPasswordModal = true;
        this.cdr.detectChanges();
    }   

    closePasswordModal(): void {
        this.showPasswordModal = false;
        this.selectedAccessId = 0;
        this.selectedAccess = null;
        this.newPassword = '';
        this.confirmPassword = '';
        this.cdr.detectChanges();
    }   

    saveNewPassword(): void {
        if (!this.newPassword || this.newPassword !== this.confirmPassword) {
            alert('Passwords do not match or are empty');
            return;
        }

        if (!this.vs) return;

        this.isSaving = true;
        this.cdr.detectChanges();

        const attributeName = `CUSTOM_ACCESS${this.selectedAccessId}_PASS`;
        this.vsService.setAttribute(this.vs.folderName, attributeName, this.newPassword, true).subscribe({
            next: () => {
                // Atualizar localmente
                if (this.vs?.customAccesses) {
                    const access = this.vs.customAccesses.find(a => a.id === this.selectedAccessId);
                    if (access) {
                        access.password = this.newPassword;
                    }
                }
                this.closePasswordModal();
                this.isSaving = false;
                this.actionMessage = 'Password changed successfully!';
                this.isError = false;
                this.cdr.detectChanges();

                setTimeout(() => {
                    this.actionMessage = '';
                    this.cdr.detectChanges();
                }, 3000);
            },
            error: (error) => {
                this.actionMessage = error.error?.error || 'Failed to change password';
                this.isError = true;
                this.isSaving = false;
                this.cdr.detectChanges();

                setTimeout(() => {
                    this.actionMessage = '';
                    this.cdr.detectChanges();
                }, 5000);
            }
        });
    }   

    changePassword(accessId: number): void {
        this.openPasswordModal(accessId);
    }

    /**
     * Ativa ou desativa um método de acesso
     * @param accessId - ID do acesso (1-25)
     * @param enabled - true para ativar, false para desativar
     */
    toggleAccess(accessId: number, enabled: boolean): void {
        if (!this.vs) return;
        
        this.isTogglingAccess[accessId] = true;
        this.cdr.detectChanges();
        
        const action = enabled ? 'enable' : 'disable';
        
        this.vsService.toggleAccessEnabled(this.vs.folderName, accessId, enabled).subscribe({
            next: () => {
                // Recarregar os detalhes completos do VS para obter o estado atualizado
                this.loadVSDetails(this.vs!.folderName);
                
                this.isTogglingAccess[accessId] = false;
                this.actionMessage = `Access ${action}d successfully!`;
                this.isError = false;
                this.cdr.detectChanges();
                
                setTimeout(() => {
                    this.actionMessage = '';
                    this.cdr.detectChanges();
                }, 3000);
            },
            error: (error) => {
                console.error(`Error ${action}ing access:`, error);
                this.actionMessage = error.error?.error || `Failed to ${action} access`;
                this.isError = true;
                this.isTogglingAccess[accessId] = false;
                this.cdr.detectChanges();
                
                setTimeout(() => {
                    this.actionMessage = '';
                    this.cdr.detectChanges();
                }, 5000);
            }
        });
    }

    /**
     * Limpa a descrição do acesso removendo indicações de ENABLED/DISABLED (fallback)
     */
    cleanAccessDescription(description: string): string {
        if (!description) return '';

        // Remover padrões como "ENABLED", "DISABLED", " (Enabled)", " - ENABLED", etc.
        let cleaned = description
            .replace(/\s*\(?(ENABLED|DISABLED)\)?\s*/gi, '')
            .replace(/\s*-\s*(ENABLED|DISABLED)\s*/gi, '')
            .replace(/\s*(ENABLED|DISABLED)\s*$/gi, '')
            .trim();

        return cleaned || description;
    }
}