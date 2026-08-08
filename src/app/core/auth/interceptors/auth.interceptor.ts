import { HttpContextToken, HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';

import { API_BASE_URL } from '../../config/api.config';
import { AuthRefreshCoordinator } from '../services/auth-refresh-coordinator.service';
import { AuthSessionStorage } from '../contracts/auth-session-storage';
import { AuthStore } from '../data-access/auth.store';

const REFRESH_RETRY = new HttpContextToken(() => false);

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const authStore = inject(AuthStore);
  const refreshCoordinator = inject(AuthRefreshCoordinator);
  const sessionStorage = inject(AuthSessionStorage);
  const apiBaseUrl = inject(API_BASE_URL).replace(/\/+$/, '');
  const requestUrl = request.url.split('?')[0].replace(/\/+$/, '');
  const isApiRequest = request.url === apiBaseUrl || request.url.startsWith(`${apiBaseUrl}/`);
  const isAuthRequest =
    requestUrl === `${apiBaseUrl}/auth/login` || requestUrl === `${apiBaseUrl}/auth/refresh`;

  if (!isApiRequest || isAuthRequest) {
    return next(request);
  }

  const accessToken = authStore.accessToken();
  const persistedSession = sessionStorage.read();

  if (!persistedSession || persistedSession.accessToken !== accessToken) {
    authStore.logout();
    return throwError(() => createMissingSessionError());
  }

  const authenticatedRequest = accessToken
    ? request.clone({
        setHeaders: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
    : request;

  return next(authenticatedRequest).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse) || error.status !== 401) {
        return throwError(() => error);
      }

      const currentPersistedSession = sessionStorage.read();

      if (
        request.context.get(REFRESH_RETRY) ||
        !authStore.refreshToken() ||
        !currentPersistedSession ||
        currentPersistedSession.refreshToken !== authStore.refreshToken()
      ) {
        authStore.logout();
        return throwError(() => error);
      }

      return refreshCoordinator.refreshAccessToken().pipe(
        switchMap((newAccessToken) =>
          next(
            request.clone({
              context: request.context.set(REFRESH_RETRY, true),
              setHeaders: {
                Authorization: `Bearer ${newAccessToken}`,
              },
            }),
          ),
        ),
        catchError((retryError: unknown) => {
          if (retryError instanceof HttpErrorResponse && retryError.status === 401) {
            authStore.logout();
          }

          return throwError(() => retryError);
        }),
      );
    }),
  );
};

function createMissingSessionError(): HttpErrorResponse {
  return new HttpErrorResponse({
    status: 401,
    statusText: 'Authentication session is no longer available',
  });
}
