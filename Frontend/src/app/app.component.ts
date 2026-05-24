import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { RouterModule, RouterOutlet, Router } from '@angular/router';
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
                    <h1>DEI Virtual Servers Private Cloud</h1>
                </div>
                <div class="header-right">
                    <!-- Remover *ngIf para testar - sempre mostrar o container, mesmo vazio -->
                    <div class="credit-info">
                        <span class="credit-label">Used credit:</span>
                        <span class="credit-value" [class.warning]="isLowCredit()">
                            {{ getCreditText() }}
                        </span>
                    </div>
                    <div class="user-info">
                        <span>Welcome, {{ user.username }}</span>
                        <button (click)="logout()">Logout</button>
                    </div>
                </div>
            </div>
            <div class="nav-menu">
                <a routerLink="/vs" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}">My Virtual Servers</a>
                <a routerLink="/templates" routerLinkActive="active">Templates</a>
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
            font-size: 1.3rem;
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
            min-width: 100px;
            text-align: center;
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
        
        .nav-menu {
            background: #34495e;
            padding: 0 20px;
            display: flex;
            gap: 20px;
        }
        
        .nav-menu a {
            color: white;
            text-decoration: none;
            padding: 12px 16px;
            transition: background 0.2s;
        }
        
        .nav-menu a:hover {
            background: #3d566e;
        }
        
        .nav-menu a.active {
            background: #1abc9c;
            color: white;
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
            
            .nav-menu {
                justify-content: center;
            }
        }
    `]
})
export class AppComponent implements OnInit, OnDestroy {
    credit: CreditInfo | null = null;
    private creditSubscription: Subscription | null = null;
    private userSubscription: Subscription | null = null;
    private isRestoringSession = false;
    
    constructor(
        public authService: AuthService,
        private creditService: CreditService,
        private router: Router,
        private cdr: ChangeDetectorRef
    ) {}
    
    ngOnInit(): void {
        console.log('AppComponent: Initializing');
        
        this.creditSubscription = this.creditService.credit$.subscribe(credit => {
            console.log('AppComponent: Credit updated:', credit);
            this.credit = credit;
            this.cdr.detectChanges();
        });
        
        this.userSubscription = this.authService.currentUser$
            .pipe(filter(user => user !== null))
            .subscribe(user => {
                console.log('AppComponent: User logged in:', user?.username);
                
                this.creditService.getCredit().subscribe({
                    next: () => {
                        console.log('AppComponent: Credit loaded successfully');
                        this.cdr.detectChanges();
                    },
                    error: (err) => console.error('AppComponent: Error loading credit:', err)
                });
                
                const currentUrl = this.router.url;
                if (currentUrl === '/' || currentUrl === '/login') {
                    console.log('AppComponent: Redirecting from root to /vs');
                    this.router.navigate(['/vs']);
                } else {
                    console.log('AppComponent: Staying on current URL:', currentUrl);
                }
            });
        this.restoreRouteAfterRefresh();
    }
    
    ngOnDestroy(): void {
        if (this.creditSubscription) {
            this.creditSubscription.unsubscribe();
        }
        if (this.userSubscription) {
            this.userSubscription.unsubscribe();
        }
    }
    
    /**
     * Restaura a rota após refresh do browser
     */
    private restoreRouteAfterRefresh(): void {
        window.addEventListener('beforeunload', () => {
            const currentUrl = this.router.url;
            if (currentUrl !== '/login' && currentUrl !== '/') {
                sessionStorage.setItem('redirectAfterLogin', currentUrl);
            }
        });
        
        const savedRoute = sessionStorage.getItem('redirectAfterLogin');
        if (savedRoute && savedRoute !== '/login' && savedRoute !== '/') {
            console.log('AppComponent: Restoring route:', savedRoute);
            sessionStorage.removeItem('redirectAfterLogin');
            setTimeout(() => {
                if (this.authService.isAuthenticated()) {
                    this.router.navigate([savedRoute]);
                }
            }, 50);
        }
    }
    
    getCreditText(): string {
        if (this.credit) {
            return `${this.credit.used} / ${this.credit.total}`;
        }
        return 'Loading...';
    }
    
    isLowCredit(): boolean {
        if (!this.credit) return false;
        const percentage = (this.credit.used / this.credit.total) * 100;
        return percentage > 80;
    }
    
    logout(): void {
        sessionStorage.removeItem('redirectAfterLogin');
        this.authService.logout();
        this.router.navigate(['/login']);
    }
}