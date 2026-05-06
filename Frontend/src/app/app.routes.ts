import { Routes } from '@angular/router';
import { LoginComponent } from './components/ts/login.component';
import { DashboardComponent } from './components/ts/dashboard.component';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
    { path: 'login', component: LoginComponent },
    { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
    { path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard] },
    { path: '**', redirectTo: '/dashboard' }
];