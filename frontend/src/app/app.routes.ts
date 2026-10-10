import { Routes } from '@angular/router';
import { adminGuard, authGuard, guestGuard } from './core/http';

export const routes: Routes = [
  { path: 'login', canActivate: [guestGuard], loadComponent: () => import('./features/auth/login.component').then(m => m.LoginComponent) },
  { path: '', canActivate: [authGuard], loadComponent: () => import('./features/shell/shell.component').then(m => m.ShellComponent), children: [
    { path: 'dashboard', loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent) },
    { path: 'records', loadComponent: () => import('./features/verifications/records-page.component').then(m => m.RecordsPageComponent) },
    { path: 'admin/users', canActivate: [adminGuard], loadComponent: () => import('./features/admin/users.component').then(m => m.UsersComponent) },
    { path: '', pathMatch: 'full', redirectTo: 'dashboard' }
  ] },
  { path: '**', redirectTo: 'dashboard' }
];
