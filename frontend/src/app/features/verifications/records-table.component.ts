import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { DatePipe, NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, Subscription, catchError, debounceTime, of, switchMap, tap } from 'rxjs';
import { NotificationService, VerificationService } from '../../core/services';
import { STATUSES, TYPES, VRecord } from '../../core/models';

@Component({ selector: 'vf-records-table', standalone: true, imports: [NgIf, NgFor, FormsModule, DatePipe], template: `
<section class="card">
  <div class="toolbar">
    <input type="search" placeholder="Search name or ID" [(ngModel)]="q" (ngModelChange)="search$.next()" aria-label="Search records">
    <select [(ngModel)]="status" (ngModelChange)="reset()" aria-label="Status"><option value="">All statuses</option><option *ngFor="let s of statuses">{{s}}</option></select>
    <select [(ngModel)]="type" (ngModelChange)="reset()" aria-label="Type"><option value="">All types</option><option *ngFor="let t of types">{{t}}</option></select>
  </div>
  <div class="alert" *ngIf="error">{{error}} <button class="link" (click)="load()">Retry</button></div>
  <div class="scroll"><table class="tbl">
    <thead><tr><th *ngFor="let c of cols"><button class="th" (click)="setSort(c[0])">{{c[1]}}{{sort === c[0] ? (order === 'asc' ? ' ▲' : ' ▼') : ''}}</button></th><th>Details</th></tr></thead>
    <tbody>
      <tr *ngIf="loading"><td [attr.colspan]="cols.length + 1"><div class="skeleton" *ngFor="let i of [1,2,3,4,5]"></div></td></tr>
      <ng-container *ngIf="!loading">
        <tr *ngFor="let r of items"><td>{{r.id}}</td><td>{{r.candidateName}}</td><td>{{r.department}}</td><td>{{r.type}}</td><td>{{r.assignedTo}}</td>
          <td><span class="badge" [class]="'badge s-' + slug(r.status)">{{r.status}}</span></td><td>{{r.createdAt | date:'mediumDate'}}</td><td>{{r.updatedAt | date:'mediumDate'}}</td>
          <td><button class="link" (click)="selected = selected?.id === r.id ? null : r">{{selected?.id === r.id ? 'Close' : 'View'}}</button></td></tr>
        <tr *ngIf="!items.length && !error"><td [attr.colspan]="cols.length + 1" class="empty">No verifications match these filters. Clear the search or choose another status.</td></tr>
      </ng-container>
    </tbody></table></div>
  <div class="detail" *ngIf="selected"><b>{{selected.id}}</b> {{selected.candidateName}}, {{selected.type}} for {{selected.department}}. Assigned to {{selected.assignedTo}}; currently {{selected.status}}.</div>
  <div class="pager"><span>{{total}} records</span><span class="grow"></span>
    <button class="btn" [disabled]="page <= 1 || loading" (click)="go(page - 1)">Previous</button><span>Page {{page}} of {{pages}}</span>
    <button class="btn" [disabled]="page >= pages || loading" (click)="go(page + 1)">Next</button></div>
</section>` })
export class RecordsTableComponent implements OnInit, OnDestroy {
  private svc = inject(VerificationService); private note = inject(NotificationService);
  statuses = STATUSES; types = TYPES;
  cols: [string, string][] = [['id', 'ID'], ['candidateName', 'Candidate'], ['department', 'Department'], ['type', 'Type'], ['assignedTo', 'Assigned to'], ['status', 'Status'], ['createdAt', 'Created'], ['updatedAt', 'Updated']];
  items: VRecord[] = []; total = 0; page = 1; pageSize = 8; loading = true; error = ''; q = ''; status = ''; type = ''; sort = 'createdAt'; order: 'asc' | 'desc' = 'desc'; selected: VRecord | null = null;
  search$ = new Subject<void>(); private trigger$ = new Subject<void>(); private subs = new Subscription();
  get pages() { return Math.max(1, Math.ceil(this.total / this.pageSize)); }
  slug(s: string) { return s.toLowerCase().replace(/\s+/g, '-'); }
  ngOnInit() {
    this.subs.add(this.search$.pipe(debounceTime(300)).subscribe(() => this.reset()));
    this.subs.add(this.trigger$.pipe(
      tap(() => { this.loading = true; this.error = ''; }),
      switchMap(() => this.svc.list({ q: this.q, status: this.status, type: this.type, sort: this.sort, order: this.order, page: this.page, pageSize: this.pageSize })
        .pipe(catchError(e => { this.error = this.note.message(e); return of(null); })))
    ).subscribe(r => { this.loading = false; if (r) { this.items = r.items; this.total = r.total; } else { this.items = []; } }));
    this.load();
  }
  ngOnDestroy() { this.subs.unsubscribe(); }
  load() { this.trigger$.next(); }
  reset() { this.page = 1; this.load(); }
  go(p: number) { this.page = p; this.load(); }
  setSort(k: string) { this.order = this.sort === k && this.order === 'asc' ? 'desc' : 'asc'; this.sort = k; this.reset(); }
}
