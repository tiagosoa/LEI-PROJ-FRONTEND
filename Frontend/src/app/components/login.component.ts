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
                <h2>DEI Private Cloud</h2>
                <p class="subtitle">Login</p>
                
                <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
                    <div class="form-group">
                        <label for="username">Username</label>
                        <input
                            type="text"
                            id="username"
                            formControlName="username"
                            placeholder="e.g., 1234567"
                            [class.is-invalid]="loginForm.get('username')?.invalid && loginForm.get('username')?.touched"
                        >
                        <div class="invalid-feedback" *ngIf="loginForm.get('username')?.invalid && loginForm.get('username')?.touched">
                            Username is required
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="password">Password</label>
                        <input
                            type="password"
                            id="password"
                            formControlName="password"
                            placeholder="Your password"
                            [class.is-invalid]="loginForm.get('password')?.invalid && loginForm.get('password')?.touched"
                        >
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
            </div>
        </div>
    `,
    styles: [`
    .login-container {
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 100vh;
        background: #e0e0e0;
    }
    .login-card {
        background: white;
        border-radius: 8px;
        padding: 40px;
        width: 100%;
        max-width: 400px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
    }
    .login-card h2 {
        margin: 0 0 8px 0;
        color: #333;
        text-align: center;
    }
    .subtitle {
        text-align: center;
        color: #666;
        margin-bottom: 30px;
    }
    .form-group {
        margin-bottom: 20px;
    }
    .form-group label {
        display: block;
        margin-bottom: 5px;
        color: #555;
        font-weight: 500;
    }
    .form-group input {
        width: 100%;
        padding: 10px;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 14px;
        transition: border-color 0.2s;
    }
    .form-group input:focus {
        outline: none;
        border-color: #667eea;
    }
    .form-group input.is-invalid {
        border-color: #e74c3c;
    }
    .invalid-feedback {
        color: #e74c3c;
        font-size: 12px;
        margin-top: 5px;
    }
    .error-message {
        background: #fee;
        color: #e74c3c;
        padding: 10px;
        border-radius: 4px;
        margin-bottom: 20px;
        text-align: center;
        font-size: 14px;
    }
    button {
        width: 100%;
        padding: 12px;
        background: #4a90e2;
        color: white;
        border: none;
        border-radius: 4px;
        font-size: 16px;
        font-weight: 500;
        cursor: pointer;
        transition: background-color 0.2s;
    }
    button:hover:not(:disabled) {
        background: #357abd; 
    }
    button:disabled {
        background: #ccc;
        cursor: not-allowed;
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
        
        // Redirecionar se já estiver autenticado
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
                console.error('Login error:', error);
            }
        });
    }
}