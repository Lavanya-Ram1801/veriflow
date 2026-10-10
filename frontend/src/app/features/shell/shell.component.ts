import { Component, inject } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService, DelayService } from '../../core/services';
import { LogoComponent } from '../../shared/logo.component';

@Component({ selector: 'vf-shell', standalone: true, imports: [RouterOutlet, RouterLink, RouterLinkActive, NgIf, NgFor, FormsModule, LogoComponent], template: `
<div class="shell" [class.collapsed]="collapsed">
  <aside class="side"><vf-logo />
    <nav>
      <a routerLink="/dashboard" routerLinkActive="on">Dashboard</a>
      <a routerLink="/records" routerLinkActive="on">Verifications</a>
      <a *ngIf="auth.user?.role === 'Admin'" routerLink="/admin/users" routerLinkActive="on">User management</a>
    </nav>
  </aside>
  <div class="main">
    <header class="top">
      <button class="btn ghost" (click)="collapsed = !collapsed" aria-label="Toggle sidebar">Menu</button>
      <span class="grow"></span>
      <label class="delay">API delay <select [(ngModel)]="delay.ms"><option *ngFor="let d of delay.options" [ngValue]="d">{{d}} ms</option></select></label>
      <div class="profile"><button class="btn ghost" (click)="menu = !menu">{{auth.user?.fullName}}</button>
        <div class="menu" *ngIf="menu"><b>{{auth.user?.fullName}}</b><span>{{auth.user?.userId}} · {{auth.user?.role}}</span><button class="btn" (click)="auth.logout()">Sign out</button></div></div>
    </header>
    <main><router-outlet /></main>
  </div>
</div>` })
export class ShellComponent { auth = inject(AuthService); delay = inject(DelayService); collapsed = false; menu = false; }
