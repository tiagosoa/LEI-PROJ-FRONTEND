import { Component } from '@angular/core';
import { RouterModule, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './services/auth.service';

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [RouterModule, RouterOutlet, CommonModule],
    template: `
        <div class="app-container" *ngIf="(authService.currentUser$ | async) as user; else login">
            <div class="app-header">
                <h1>DEI Private Cloud</h1>
                <div class="user-info">
                    <span>Welcome, {{ user.username }}</span>
                    <button (click)="logout()">Logout</button>
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
        background: #4a5568;  /* Cinzento escuro em vez de gradiente roxo */
        color: white;
        padding: 15px 20px;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    .app-header h1 {
        margin: 0;
        font-size: 1.5rem;
    }
    .user-info {
        display: flex;
        gap: 15px;
        align-items: center;
    }
    .user-info button {
        background: rgba(255,255,255,0.2);
        border: none;
        color: white;
        padding: 5px 10px;
        border-radius: 4px;
        cursor: pointer;
    }
    .user-info button:hover {
        background: rgba(255,255,255,0.3);
    }
    .app-content {
        background: #e0e0e0;  /* Fundo cinzento para o conteúdo */
        min-height: calc(100vh - 60px);
        padding: 20px;
    }
`]
})
export class AppComponent {
    constructor(public authService: AuthService) {}
    
    logout(): void {
        this.authService.logout();
        window.location.href = '/login';
    }
}