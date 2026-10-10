import { APP_INITIALIZER, ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { routes } from './app.routes';
import { apiInterceptor } from './core/http';
import { AuthService } from './core/services';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes), provideHttpClient(withInterceptors([apiInterceptor])),
    { provide: APP_INITIALIZER, multi: true, deps: [AuthService], useFactory: (a: AuthService) => () => firstValueFrom(a.restore()) }
  ]
};
