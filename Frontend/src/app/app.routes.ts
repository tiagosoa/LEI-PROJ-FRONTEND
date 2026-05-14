import { Routes } from '@angular/router';
import { LoginComponent } from './components/login.component';
import { DashboardComponent } from './components/dashboard.component';
import { VSListComponent } from './components/vs-list.component';
import { VSTListComponent } from './components/vst-list.component';
import { VSDetailsComponent } from './components/vs-details.component';
import { TestComponent } from './components/test.component';
import { AuthGuard } from './guards/auth.guard';
import { VSExistsGuard } from './guards/vs-exists.guard';

export const routes: Routes = [
    { path: 'login', component: LoginComponent },
    { path: 'vs', component: VSListComponent, canActivate: [AuthGuard] },
    { path: 'vs/:folderName', component: VSDetailsComponent, canActivate: [AuthGuard, VSExistsGuard] },
    { path: 'templates', component: VSTListComponent, canActivate: [AuthGuard] },
    { path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard] },
    { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
    { path: 'test', component: TestComponent },
    { path: '**', redirectTo: '/dashboard' }
];