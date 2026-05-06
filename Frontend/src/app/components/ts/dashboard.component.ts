import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [CommonModule],
    template: `
        <div class="dashboard-container">
            <h2>Dashboard</h2>
            <p>Bem-vindo à Private Cloud do DEI</p>
            <div class="credit-info" *ngIf="!isLoading">
                <h3>Your Credit</h3>
                <p>Loading credit information...</p>
            </div>
        </div>
    `,
    styles: [`
        .dashboard-container {
            padding: 20px;
            text-align: center;
        }
        .dashboard-container h2 {
            color: #333;
        }
        .credit-info {
            margin-top: 30px;
            padding: 20px;
            background: #f5f5f5;
            border-radius: 8px;
        }
    `]
})
export class DashboardComponent {
    username: string = '';
    isLoading = true;
    
    constructor(private authService: AuthService) {
        const user = this.authService.getCurrentUser();
        this.username = user?.username || 'User';
        this.isLoading = false;
    }
}