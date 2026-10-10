import { Component, inject } from '@angular/core';
import { NgIf } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService, NotificationService } from '../../core/services';
import { Role } from '../../core/models';
import { LogoComponent } from '../../shared/logo.component';

@Component({ selector: 'vf-login', standalone: true, imports: [ReactiveFormsModule, NgIf, LogoComponent], template: `
<div class="login">
  <section class="intro">
    <vf-logo />
    <h1>Every check, traced from request to result.</h1>
    <p>VeriFlow keeps employment, education, identity and address verifications in one place, with each record visible only to the people responsible for it.</p>
    <svg class="flow" viewBox="0 0 360 120" aria-hidden="true"><path d="M10 90 C90 90 90 30 180 30 S270 90 350 40" fill="none" stroke="#8b7cff" stroke-width="2" stroke-dasharray="4 7"/><g fill="#0f1535" stroke="#8b7cff" stroke-width="2"><circle cx="10" cy="90" r="9"/><circle cx="180" cy="30" r="9"/></g><circle cx="350" cy="40" r="11" fill="#3fd8c8"/><path d="M345 40l4 4 7-8" fill="none" stroke="#0f1535" stroke-width="2.5"/></svg>
    <ul><li>Passwords stored as bcrypt hashes</li><li>Roles enforced by the API, not just the screen</li><li>Sessions end on sign out</li></ul>
  </section>
  <section class="formside">
    <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
      <h2>Sign in</h2>
      <p class="muted">Use one of the demo accounts below.</p>
      <div class="alert" *ngIf="error" role="alert">{{error}}</div>
      <label class="field">User ID<input formControlName="userId" autocomplete="username">
        <small *ngIf="form.controls.userId.touched && form.controls.userId.invalid">Enter your user ID.</small></label>
      <label class="field">Password<span class="pw"><input [type]="show ? 'text' : 'password'" formControlName="password" autocomplete="current-password"><button type="button" class="link" (click)="show=!show">{{show ? 'Hide' : 'Show'}}</button></span>
        <small *ngIf="form.controls.password.touched && form.controls.password.invalid">Enter your password.</small></label>
      <label class="field">Sign in as<select formControlName="role"><option>General User</option><option>Admin</option></select></label>
      <button class="btn primary wide" [disabled]="loading"><span class="spin" *ngIf="loading"></span>{{loading ? 'Signing in' : 'Sign in'}}</button>
      <div class="demo"><span>Demo accounts</span>
        <button type="button" class="chip" (click)="fill('admin01','Admin@123','Admin')">Admin</button>
        <button type="button" class="chip" (click)="fill('user01','User@123','General User')">General user</button></div>
    </form>
  </section>
</div>` })
export class LoginComponent {
  private fb = inject(FormBuilder); private auth = inject(AuthService); private router = inject(Router); private note = inject(NotificationService);
  show = false; loading = false; error = '';
  form = this.fb.nonNullable.group({ userId: ['', Validators.required], password: ['', Validators.required], role: ['General User' as Role, Validators.required] });
  fill(u: string, p: string, r: Role) { this.form.setValue({ userId: u, password: p, role: r }); }
  submit() {
    if (this.loading) return;
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading = true; this.error = '';
    const v = this.form.getRawValue();
    this.auth.login(v.userId.trim(), v.password, v.role).pipe(finalize(() => this.loading = false))
      .subscribe({ next: () => this.router.navigate(['/dashboard']), error: e => this.error = this.note.message(e) });
  }
}
