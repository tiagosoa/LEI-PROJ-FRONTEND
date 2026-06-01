import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterModule],
    template: `
        <div class="login-container">
            <div class="login-card">
                <div class="logo-section">
                    <img src="assets/dei-logo.png" alt="DEI Logo" class="logo">
                    <h2>DEI Virtual Servers<br>Private Cloud</h2>
                </div>
                <p class="subtitle">Login to access your virtual servers</p>
                
                <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
                    <div class="form-group">
                        <label for="username">Username</label>
                        <div class="input-wrapper">
                            <input
                                type="text"
                                id="username"
                                formControlName="username"
                                placeholder="e.g., 1234567"
                                [class.is-invalid]="loginForm.get('username')?.invalid && loginForm.get('username')?.touched"
                            >
                        </div>
                        <div class="invalid-feedback" *ngIf="loginForm.get('username')?.invalid && loginForm.get('username')?.touched">
                            Username is required
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="password">Password</label>
                        <div class="input-wrapper">
                            <input
                                type="password"
                                id="password"
                                formControlName="password"
                                placeholder="Your password"
                                [class.is-invalid]="loginForm.get('password')?.invalid && loginForm.get('password')?.touched"
                            >
                        </div>
                        <div class="invalid-feedback" *ngIf="loginForm.get('password')?.invalid && loginForm.get('password')?.touched">
                            Password is required
                        </div>
                    </div>
                    
                    <div class="error-message" *ngIf="errorMessage">
                        {{ errorMessage }}
                    </div>
                    
                    <button type="submit" [disabled]="loginForm.invalid || isLoading">
                        {{ isLoading ? 'Logging in...' : 'Login' }}
                    </button>
                </form>
                
                <div class="footer-note">
                    <p>Access to DEI Private Cloud requires institutional credentials</p>
                </div>
            </div>
        </div>
    `,
    styles: [`
        .login-container {
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            background: radial-gradient(circle at 20% 40%, rgba(100, 100, 255, 0.1) 0%, transparent 50%);
            position: relative;
            overflow: hidden;
        }
        
        .login-container::before {
            content: '';
            position: absolute;
            width: 100%;
            height: 100%;
            background: radial-gradient(circle at 20% 40%, rgba(100, 100, 255, 0.1) 0%, transparent 50%);
            pointer-events: none;
        }
        
        .login-card {
            background: rgba(255, 255, 255, 0.98);
            border-radius: 24px;
            padding: 40px;
            width: 100%;
            max-width: 420px;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
            backdrop-filter: blur(10px);
            transition: transform 0.3s ease;
            animation: fadeInUp 0.6s ease-out;
        }
        
        .login-card:hover {
            transform: translateY(-5px);
        }
        
        .logo-section {
            text-align: center;
            margin-bottom: 24px;
        }
        
        .logo {
            width: 120px;
            height: auto;
            margin-bottom: 16px;
            filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1));
        }
        
        .logo-section h2 {
            margin: 0;
            color: #1a1a2e;
            font-size: 1.5rem;
            font-weight: 600;
            letter-spacing: -0.5px;
            line-height: 1.3;
        }
        
        .subtitle {
            text-align: center;
            color: #666;
            margin-bottom: 32px;
            font-size: 0.9rem;
            border-bottom: 1px solid #eee;
            padding-bottom: 16px;
        }
        
        .form-group {
            margin-bottom: 24px;
        }
        
        .form-group label {
            display: block;
            margin-bottom: 8px;
            color: #333;
            font-weight: 500;
            font-size: 0.85rem;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .input-wrapper {
            position: relative;
            display: flex;
            align-items: center;
        }
        
        .input-icon {
            position: absolute;
            left: 12px;
            font-size: 1.1rem;
            color: #999;
        }
        
        .form-group input {
            width: 100%;
            padding: 12px 12px 12px 40px;
            border: 2px solid #e0e0e0;
            border-radius: 12px;
            font-size: 15px;
            transition: all 0.3s ease;
            background: #f8f9fa;
        }
        
        .form-group input:focus {
            outline: none;
            border-color: #4a90e2;
            background: white;
            box-shadow: 0 0 0 3px rgba(74, 144, 226, 0.1);
        }
        
        .form-group input.is-invalid {
            border-color: #e74c3c;
            background: #fff5f5;
        }
        
        .invalid-feedback {
            color: #e74c3c;
            font-size: 12px;
            margin-top: 6px;
            margin-left: 12px;
        }
        
        .error-message {
            background: linear-gradient(135deg, #fee 0%, #fdd 100%);
            color: #e74c3c;
            padding: 12px 16px;
            border-radius: 12px;
            margin-bottom: 24px;
            text-align: center;
            font-size: 14px;
            border-left: 4px solid #e74c3c;
            font-weight: 500;
        }
        
        button {
            width: 100%;
            padding: 14px;
            background: linear-gradient(135deg, #4a90e2 0%, #357abd 100%);
            color: white;
            border: none;
            border-radius: 12px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        button:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px -5px rgba(74, 144, 226, 0.4);
        }
        
        button:active:not(:disabled) {
            transform: translateY(0);
        }
        
        button:disabled {
            background: #ccc;
            cursor: not-allowed;
            transform: none;
        }
        
        .footer-note {
            margin-top: 24px;
            text-align: center;
            font-size: 0.7rem;
            color: #999;
            border-top: 1px solid #eee;
            padding-top: 16px;
        }
        
        .footer-note p {
            margin: 0;
        }
        
        @keyframes fadeInUp {
            from {
                opacity: 0;
                transform: translateY(30px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        @media (max-width: 480px) {
            .login-card {
                margin: 20px;
                padding: 30px 20px;
            }
            
            .logo {
                width: 60px;
            }
            
            .logo-section h2 {
                font-size: 1.2rem;
            }
        }
    `]
})
export class LoginComponent {
    loginForm: FormGroup;
    isLoading = false;
    errorMessage = '';
    
    constructor(
        private fb: FormBuilder,
        private authService: AuthService,
        private router: Router
    ) {
        this.loginForm = this.fb.group({
            username: ['', [Validators.required]],
            password: ['', [Validators.required]]
        });
        
        if (this.authService.isAuthenticated()) {
            this.router.navigate(['/dashboard']);
        }
    }
    
    onSubmit(): void {
        if (this.loginForm.invalid) {
            return;
        }
        
        this.isLoading = true;
        this.errorMessage = '';
        
        const { username, password } = this.loginForm.value;
        
        this.authService.login({ username, password }).subscribe({
            next: () => {
                this.router.navigate(['/dashboard']);
            },
            error: (error) => {
                this.isLoading = false;
                if (error.status === 401) {
                    this.errorMessage = 'Invalid username or password';
                } else {
                    this.errorMessage = 'Authentication service unavailable. Please try again later.';
                }
            }
        });
    }
}