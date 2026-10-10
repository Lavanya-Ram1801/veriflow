import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { catchError, throwError, timeout } from 'rxjs';
import { AuthService, DelayService, NotificationService } from './services';

export const apiInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService), delay = inject(DelayService), router = inject(Router), note = inject(NotificationService);
  let r = req;
  if (auth.token) r = r.clone({ setHeaders: { Authorization: `Bearer ${auth.token}` } });
  if (delay.ms > 0 && !r.params.has('delay') && !r.url.includes('/health')) r = r.clone({ setParams: { delay: String(delay.ms) } });
  return next(r).pipe(timeout(20000), catchError(e => {
    if (e.status === 401 && !req.url.includes('/auth/login')) { auth.clear(); note.error('Your session ended. Sign in again.'); router.navigate(['/login']); }
    return throwError(() => e);
  }));
};
export const authGuard: CanActivateFn = () => { const a = inject(AuthService); return a.user ? true : inject(Router).createUrlTree(['/login']); };
export const adminGuard: CanActivateFn = () => { const a = inject(AuthService); return a.user?.role === 'Admin' ? true : inject(Router).createUrlTree(['/dashboard']); };
export const guestGuard: CanActivateFn = () => { const a = inject(AuthService); return a.user ? inject(Router).createUrlTree(['/dashboard']) : true; };
