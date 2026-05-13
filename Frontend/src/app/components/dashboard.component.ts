import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [CommonModule, RouterModule],
    template: `
        <div class="dashboard-container">
            <h2>Dashboard</h2>
            <p>Welcome to the DEI Private Cloud, {{ username }}!</p>
            
            <div class="quick-actions">
                <div class="action-card" routerLink="/vs">
                    <div class="action-icon">🖥️</div>
                    <h3>My Virtual Servers</h3>
                    <p>View and manage your VS</p>
                </div>
                
                <div class="action-card" routerLink="/templates">
                    <div class="action-icon">📦</div>
                    <h3>Templates</h3>
                    <p>Create new VS from templates</p>
                </div>
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
            margin-bottom: 40px;
        }
        
        .quick-actions {
            display: flex;
            justify-content: center;
            gap: 30px;
            flex-wrap: wrap;
            margin-top: 40px;
        }
        
        .action-card {
            background: white;
            border: 3px solid #333;
            border-radius: 8px;
            padding: 30px;
            width: 250px;
            text-align: center;
            cursor: pointer;
            transition: transform 0.2s, box-shadow 0.2s;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        
        .action-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        
        .action-icon {
            font-size: 48px;
            margin-bottom: 16px;
        }
        
        .action-card h3 {
            margin: 0 0 8px 0;
            color: #333;
        }
        
        .action-card p {
            margin: 0;
            color: #666;
            font-size: 0.9rem;
        }
    `]
})
export class DashboardComponent {
    username: string = '';
    
    constructor(private authService: AuthService) {
        const user = this.authService.getCurrentUser();
        this.username = user?.username || 'User';
    }
}