import { Component, inject } from '@angular/core';
import { AsyncPipe, NgFor } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { NotificationService } from './core/services';

@Component({ selector: 'vf-root', standalone: true, imports: [RouterOutlet, AsyncPipe, NgFor], template: `
<router-outlet />
<div class="toasts" aria-live="polite"><div *ngFor="let t of note.toasts$ | async" class="toast" [class.err]="t.type==='err'">{{t.text}}</div></div>` })
export class AppComponent { note = inject(NotificationService); }
