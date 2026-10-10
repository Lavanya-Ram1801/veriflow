import { Component, OnInit, inject } from '@angular/core';
import { DatePipe, NgFor, NgIf } from '@angular/common';
import { forkJoin } from 'rxjs';
import { DashboardService, NotificationService, UserService } from '../../core/services';
import { Activity, Stats, User } from '../../core/models';
import { RecordsTableComponent } from '../verifications/records-table.component';

@Component({ selector: 'vf-dashboard', standalone: true, imports: [NgIf, NgFor, DatePipe, RecordsTableComponent], template: `
<h1>Welcome back, {{profile ? profile.fullName : '...'}}</h1>
<div class="alert" *ngIf="error">{{error}} <button class="link" (click)="load()">Retry</button></div>
<div class="grid2">
  <section class="card profile-card"><h3>Profile</h3>
    <div class="skeleton" *ngIf="loading"></div>
    <dl *ngIf="profile"><dt>User ID</dt><dd>{{profile.userId}}</dd><dt>Role</dt><dd>{{profile.role}}</dd><dt>Department</dt><dd>{{profile.department}}</dd><dt>Email</dt><dd>{{profile.email}}</dd></dl></section>
  <section class="stats">
    <div class="stat" *ngFor="let s of cards"><span>{{s[0]}}</span><b *ngIf="stats">{{stats[s[1]]}}</b><div class="skeleton short" *ngIf="loading"></div></div>
  </section>
</div>
<section class="card"><h3>Recent activity</h3>
  <div class="skeleton" *ngIf="loading"></div>
  <p class="empty" *ngIf="!loading && !activity.length">No activity yet.</p>
  <ul class="feed"><li *ngFor="let a of activity">{{a.message}}<time>{{a.at | date:'MMM d, h:mm a'}}</time></li></ul></section>
<h3>Verification records</h3>
<vf-records-table />` })
export class DashboardComponent implements OnInit {
  private users = inject(UserService); private dash = inject(DashboardService); private note = inject(NotificationService);
  loading = true; error = ''; profile?: User; stats?: Stats; activity: Activity[] = [];
  cards: [string, keyof Stats][] = [['Total records', 'total'], ['Pending', 'pending'], ['In progress', 'inProgress'], ['Completed', 'completed']];
  ngOnInit() { this.load(); }
  load() {
    this.loading = true; this.error = '';
    forkJoin({ profile: this.users.profile(), stats: this.dash.stats(), activity: this.dash.activity() }).subscribe({
      next: r => { this.profile = r.profile; this.stats = r.stats; this.activity = r.activity; this.loading = false; },
      error: e => { this.error = this.note.message(e); this.loading = false; } });
  }
}
