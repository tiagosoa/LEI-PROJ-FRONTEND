import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { RouterModule, RouterOutlet, NavigationEnd, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './services/auth.service';
import { CreditService } from './services/credit.service';
import { Subscription, filter } from 'rxjs';
import { CreditInfo } from './models/credit.model';

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [RouterModule, RouterOutlet, CommonModule],
    template: `
        <div class="app-container" *ngIf="(authService.currentUser$ | async) as user; else login">
            <div class="app-header">
                <div class="header-left">
                    <h1>DEI Private Cloud</h1>
                </div>
                <div class="header-right">
                    <div class="credit-info" *ngIf="credit">
                        <span class="credit-label">Used credit:</span>
                        <span class="credit-value" [class.warning]="isLowCredit()">
                            {{ credit.used }} / {{ credit.total }}
                        </span>
                    </div>
                    <div class="credit-info" *ngIf="!credit && isLoadingCredit">
                        <span class="credit-label">Loading credit...</span>
                    </div>
                    <div class="user-info">
                        <span>Welcome, {{ user.username }}</span>
                        <button (click)="logout()">Logout</button>
                    </div>
                </div>
            </div>
            <div class="app-content">
                <router-outlet></router-outlet>
            </div>
        </div>

        <ng-template #login>
            <router-outlet></router-outlet>
        </ng-template>
    `,
    styles: [`
        .app-header {
            background: #2c3e50;
            color: white;
            padding: 15px 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 16px;
        }
        
        .header-left h1 {
            margin: 0;
            font-size: 1.5rem;
        }
        
        .header-right {
            display: flex;
            align-items: center;
            gap: 24px;
            flex-wrap: wrap;
        }
        
        .credit-info {
            background: rgba(255, 255, 255, 0.15);
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 0.9rem;
        }
        
        .credit-label {
            margin-right: 6px;
        }
        
        .credit-value {
            font-weight: bold;
        }
        
        .credit-value.warning {
            color: #ffc107;
        }
        
        .user-info {
            display: flex;
            gap: 15px;
            align-items: center;
        }
        
        .user-info button {
            background: rgba(255, 255, 255, 0.2);
            border: none;
            color: white;
            padding: 5px 10px;
            border-radius: 4px;
            cursor: pointer;
        }
        
        .user-info button:hover {
            background: rgba(255, 255, 255, 0.3);
        }
        
        .app-content {
            padding: 20px;
        }
        
        @media (max-width: 768px) {
            .app-header {
                flex-direction: column;
                text-align: center;
            }
            
            .header-right {
                justify-content: center;
            }
        }
    `]
})
export class AppComponent implements OnInit, OnDestroy {
    credit: CreditInfo | null = null;
    isLoadingCredit: boolean = false;
    private creditSubscription: Subscription | null = null;
    private userSubscription: Subscription | null = null;
    private routerSubscription: Subscription | null = null;
    
    constructor(
        public authService: AuthService,
        private creditService: CreditService,
        private cdr: ChangeDetectorRef,
        private router: Router
    ) {}
    
    ngOnInit(): void {
        // Subscrever mudanças no crédito
        this.creditSubscription = this.creditService.credit$.subscribe(credit => {
            this.credit = credit;
            this.isLoadingCredit = false;
            this.cdr.detectChanges();  // Forçar atualização imediata
        });
        
        // Subscrever mudanças no utilizador autenticado
        this.userSubscription = this.authService.currentUser$.subscribe(user => {
            if (user) {
                // Utilizador autenticado - carregar crédito imediatamente
                this.loadCredit();
            } else {
                // Sem utilizador - limpar crédito
                this.credit = null;
                this.cdr.detectChanges();
            }
        });
        
        // Recarregar crédito sempre que a navegação muda (refresh de página)
        this.routerSubscription = this.router.events.pipe(
            filter(event => event instanceof NavigationEnd)
        ).subscribe(() => {
            // Verificar se ainda está autenticado após navegação
            if (this.authService.isAuthenticated()) {
                this.loadCredit();
            }
        });
    }
    
    ngOnDestroy(): void {
        if (this.creditSubscription) {
            this.creditSubscription.unsubscribe();
        }
        if (this.userSubscription) {
            this.userSubscription.unsubscribe();
        }
        if (this.routerSubscription) {
            this.routerSubscription.unsubscribe();
        }
    }
    
    loadCredit(): void {
        this.isLoadingCredit = true;
        this.cdr.detectChanges();
        
        this.creditService.getCredit().subscribe({
            next: () => {
                // O crédito será atualizado pelo subscription do credit$
                console.log('Credit loaded successfully');
            },
            error: (error) => {
                console.error('Error loading credit:', error);
                this.isLoadingCredit = false;
                this.cdr.detectChanges();
            }
        });
    }
    
    isLowCredit(): boolean {
        if (!this.credit) return false;
        const percentage = (this.credit.used / this.credit.total) * 100;
        return percentage > 80;
    }
    
    logout(): void {
        this.authService.logout();
        this.credit = null;
        this.cdr.detectChanges();
        window.location.href = '/login';
    }
}