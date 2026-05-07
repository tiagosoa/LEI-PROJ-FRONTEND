import { Routes } from '@angular/router';
import { LoginComponent } from './components/ts/login.component';
import { DashboardComponent } from './components/ts/dashboard.component';
import { VSListComponent } from './components/ts/vs-list.component';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
    { path: 'login', component: LoginComponent },
    { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
    { path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard] },
    { path: 'vs', component: VSListComponent, canActivate: [AuthGuard] },
    { path: '**', redirectTo: '/dashboard' }
];