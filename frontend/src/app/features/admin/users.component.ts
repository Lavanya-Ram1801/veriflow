import { Component, OnInit, inject } from '@angular/core';
import { DatePipe, NgFor, NgIf } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { AuthService, NotificationService, UserService } from '../../core/services';
import { Role, User } from '../../core/models';

@Component({ selector: 'vf-users', standalone: true, imports: [NgIf, NgFor, DatePipe, FormsModule, ReactiveFormsModule], template: `
<div class="row"><h1>User management</h1><span class="grow"></span><button class="btn primary" (click)="openForm(null)">Add user</button></div>
<section class="card">
  <div class="toolbar">
    <input type="search" placeholder="Search users" [(ngModel)]="q" (ngModelChange)="load()" aria-label="Search users">
    <select [(ngModel)]="role" (ngModelChange)="load()" aria-label="Role"><option value="">All roles</option><option>Admin</option><option>General User</option></select>
    <select [(ngModel)]="active" (ngModelChange)="load()" aria-label="Status"><option value="">All accounts</option><option value="true">Active</option><option value="false">Inactive</option></select>
  </div>
  <div class="alert" *ngIf="error">{{error}} <button class="link" (click)="load()">Retry</button></div>
  <div class="scroll"><table class="tbl"><thead><tr><th>User ID</th><th>Name</th><th>Email</th><th>Department</th><th>Role</th><th>Status</th><th>Created</th><th>Actions</th></tr></thead>
  <tbody>
    <tr *ngIf="loading"><td colspan="8"><div class="skeleton" *ngFor="let i of [1,2,3]"></div></td></tr>
    <ng-container *ngIf="!loading">
      <tr *ngFor="let u of users"><td>{{u.userId}}</td><td>{{u.fullName}}</td><td>{{u.email}}</td><td>{{u.department}}</td>
        <td><span class="badge" [class.s-admin]="u.role === 'Admin'">{{u.role}}</span></td>
        <td><span class="badge" [class]="'badge ' + (u.active ? 's-completed' : 's-on-hold')">{{u.active ? 'Active' : 'Inactive'}}</span></td>
        <td>{{u.createdAt | date:'mediumDate'}}</td>
        <td><button class="link" (click)="openForm(u)">Edit</button>
          <button class="link" [disabled]="u.userId === me?.userId && u.active" (click)="confirm = u" >{{u.active ? 'Deactivate' : 'Activate'}}</button></td></tr>
      <tr *ngIf="!users.length && !error"><td colspan="8" class="empty">No users match these filters.</td></tr>
    </ng-container></tbody></table></div>
</section>

<div class="overlay" *ngIf="formOpen"><form class="modal" [formGroup]="form" (ngSubmit)="save()" novalidate>
  <h2>{{editing ? 'Edit user' : 'Add user'}}</h2>
  <label class="field">User ID<input formControlName="userId"><small *ngIf="bad('userId')">3-20 letters, numbers or underscores.</small></label>
  <label class="field">Full name<input formControlName="fullName"><small *ngIf="bad('fullName')">Enter the full name.</small></label>
  <label class="field">Email<input formControlName="email" type="email"><small *ngIf="bad('email')">Enter a valid email.</small></label>
  <label class="field">Department<input formControlName="department"><small *ngIf="bad('department')">Enter a department.</small></label>
  <label class="field">Role<select formControlName="role"><option>General User</option><option>Admin</option></select></label>
  <label class="field" *ngIf="!editing">Temporary password<input formControlName="password" type="password"><small *ngIf="bad('password')">Min 8 characters with an uppercase letter and a number.</small></label>
  <div class="alert" *ngIf="formError">{{formError}}</div>
  <div class="row end"><button type="button" class="btn" (click)="formOpen = false">Cancel</button><button class="btn primary" [disabled]="saving"><span class="spin" *ngIf="saving"></span>{{editing ? 'Save changes' : 'Create user'}}</button></div>
</form></div>

<div class="overlay" *ngIf="confirm"><div class="modal">
  <h2>{{confirm.active ? 'Deactivate' : 'Activate'}} {{confirm.userId}}?</h2>
  <p>{{confirm.active ? 'This person will be signed out of new sessions and cannot sign in until reactivated.' : 'This person will be able to sign in again.'}}</p>
  <div class="row end"><button class="btn" (click)="confirm = null">Cancel</button><button class="btn primary" [disabled]="saving" (click)="toggle()">{{confirm.active ? 'Deactivate' : 'Activate'}}</button></div>
</div></div>` })
export class UsersComponent implements OnInit {
  private svc = inject(UserService); private fb = inject(FormBuilder); private note = inject(NotificationService); private auth = inject(AuthService);
  me = this.auth.user; users: User[] = []; loading = true; error = ''; q = ''; role = ''; active = '';
  formOpen = false; editing: User | null = null; saving = false; formError = ''; confirm: User | null = null;
  form = this.fb.nonNullable.group({
    userId: ['', [Validators.required, Validators.pattern(/^[A-Za-z0-9_]{3,20}$/)]], fullName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]], department: ['', Validators.required], role: ['General User' as Role, Validators.required],
    password: ['', [Validators.required, Validators.pattern(/^(?=.*[A-Z])(?=.*\d).{8,}$/)]] });
  ngOnInit() { this.load(); }
  bad(n: 'userId' | 'fullName' | 'email' | 'department' | 'password') { const c = this.form.controls[n]; return c.touched && c.invalid; }
  load() {
    this.loading = true; this.error = '';
    this.svc.list({ q: this.q, role: this.role, active: this.active }).subscribe({ next: r => { this.users = r.items; this.loading = false; }, error: e => { this.error = this.note.message(e); this.loading = false; } });
  }
  openForm(u: User | null) {
    this.editing = u; this.formError = ''; this.formOpen = true;
    this.form.reset({ userId: u?.userId ?? '', fullName: u?.fullName ?? '', email: u?.email ?? '', department: u?.department ?? '', role: u?.role ?? 'General User', password: '' });
    if (u) { this.form.controls.userId.disable(); this.form.controls.password.disable(); } else { this.form.controls.userId.enable(); this.form.controls.password.enable(); }
  }
  save() {
    if (this.saving) return;
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving = true; this.formError = '';
    const v = this.form.getRawValue();
    const req = this.editing ? this.svc.update(this.editing.userId, v) : this.svc.create(v);
    req.pipe(finalize(() => this.saving = false)).subscribe({
      next: () => { this.note.success(this.editing ? 'User updated.' : 'User created.'); this.formOpen = false; this.load(); },
      error: e => this.formError = e?.error?.error?.details ? Object.values(e.error.error.details).join(' ') : this.note.message(e) });
  }
  toggle() {
    if (!this.confirm || this.saving) return;
    const u = this.confirm; this.saving = true;
    this.svc.setStatus(u.userId, !u.active).pipe(finalize(() => this.saving = false)).subscribe({
      next: () => { this.note.success(u.active ? 'User deactivated.' : 'User activated.'); this.confirm = null; this.load(); },
      error: e => { this.note.error(this.note.message(e)); this.confirm = null; } });
  }
}
