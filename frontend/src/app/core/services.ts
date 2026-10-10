import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, catchError, map, of, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { Activity, Page, Role, Stats, User, VRecord } from './models';

const API = environment.apiUrl;
const clean = (o: Record<string, any>) => Object.entries(o).reduce((p, [k, v]) => (v === '' || v == null ? p : p.set(k, String(v))), new HttpParams());

@Injectable({ providedIn: 'root' })
export class DelayService { ms = 0; options = [0, 1000, 2000, 4000]; }

@Injectable({ providedIn: 'root' })
export class NotificationService {
  toasts$ = new BehaviorSubject<{ id: number; type: 'ok' | 'err'; text: string }[]>([]);
  private n = 0;
  success(t: string) { this.push('ok', t); }
  error(t: string) { this.push('err', t); }
  message(e: any): string {
    if (e?.name === 'TimeoutError') return 'The server took too long to respond. Retry in a moment.';
    return e?.error?.error?.message ?? 'Could not reach the server. Check that the backend is running.';
  }
  private push(type: 'ok' | 'err', text: string) {
    const id = ++this.n; this.toasts$.next([...this.toasts$.value, { id, type, text }]);
    setTimeout(() => this.toasts$.next(this.toasts$.value.filter(t => t.id !== id)), 4500);
  }
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient); private router = inject(Router);
  private subject = new BehaviorSubject<User | null>(null);
  user$ = this.subject.asObservable();
  get user() { return this.subject.value; }
  get token() { return sessionStorage.getItem('vf_token'); }
  login(userId: string, password: string, role: Role) {
    return this.http.post<{ token: string; user: User }>(`${API}/auth/login`, { userId, password, role })
      .pipe(tap(r => { sessionStorage.setItem('vf_token', r.token); this.subject.next(r.user); }));
  }
  restore() {
    if (!this.token) return of(null);
    return this.http.get<{ user: User }>(`${API}/auth/me`).pipe(map(r => { this.subject.next(r.user); return r.user; }), catchError(() => { this.clear(); return of(null); }));
  }
  logout() { this.http.post(`${API}/auth/logout`, {}).pipe(catchError(() => of(null))).subscribe(() => { this.clear(); this.router.navigate(['/login']); }); }
  clear() { sessionStorage.removeItem('vf_token'); this.subject.next(null); }
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private http = inject(HttpClient);
  profile() { return this.http.get<{ user: User }>(`${API}/auth/me`).pipe(map(r => r.user)); }
  list(f: { q?: string; role?: string; active?: string }) { return this.http.get<Page<User>>(`${API}/users`, { params: clean(f) }); }
  create(u: any) { return this.http.post<User>(`${API}/users`, u); }
  update(id: string, u: any) { return this.http.put<User>(`${API}/users/${id}`, u); }
  setStatus(id: string, active: boolean) { return this.http.patch<User>(`${API}/users/${id}/status`, { active }); }
}

@Injectable({ providedIn: 'root' })
export class VerificationService {
  private http = inject(HttpClient);
  list(f: Record<string, any>) { return this.http.get<Page<VRecord>>(`${API}/records`, { params: clean(f) }); }
  get(id: string) { return this.http.get<VRecord>(`${API}/records/${id}`); }
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private http = inject(HttpClient);
  stats() { return this.http.get<Stats>(`${API}/dashboard/stats`); }
  activity() { return this.http.get<{ items: Activity[] }>(`${API}/dashboard/activity`).pipe(map(r => r.items)); }
}
