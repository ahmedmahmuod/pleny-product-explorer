import { inject, Injectable } from '@angular/core';
import { catchError, finalize, map, Observable, shareReplay, throwError } from 'rxjs';

import { AuthStore } from '../stores/auth.store';
import { AuthApiService } from './auth-api.service';

@Injectable({ providedIn: 'root' })
export class AuthRefreshCoordinator {
  private readonly authApi = inject(AuthApiService);
  private readonly authStore = inject(AuthStore);

  private activeRefresh: Observable<string> | null = null;

  refreshAccessToken(): Observable<string> {
    if (this.activeRefresh) {
      return this.activeRefresh;
    }

    const refreshToken = this.authStore.refreshToken();

    if (!refreshToken) {
      this.authStore.logout();
      return throwError(() => new Error('A refresh token is required to renew the session.'));
    }

    this.activeRefresh = this.authApi.refresh(refreshToken).pipe(
      map((tokens) => {
        if (this.authStore.refreshToken() !== refreshToken) {
          throw new Error('The authentication session changed during token refresh.');
        }

        this.authStore.updateTokens(tokens);
        return tokens.accessToken;
      }),
      catchError((error: unknown) => {
        this.authStore.logout();
        return throwError(() => error);
      }),
      finalize(() => {
        this.activeRefresh = null;
      }),
      shareReplay({ bufferSize: 1, refCount: false }),
    );

    return this.activeRefresh;
  }
}
