import { HttpContextToken, HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';

import { API_BASE_URL } from '../../config/api.config';
import { AuthRefreshCoordinator } from '../services/auth-refresh-coordinator.service';
import { AuthStore } from '../stores/auth.store';

const REFRESH_RETRY = new HttpContextToken(() => false);

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const authStore = inject(AuthStore);
  const refreshCoordinator = inject(AuthRefreshCoordinator);
  const apiBaseUrl = inject(API_BASE_URL).replace(/\/+$/, '');
  const requestUrl = request.url.split('?')[0].replace(/\/+$/, '');
  const isApiRequest = request.url === apiBaseUrl || request.url.startsWith(`${apiBaseUrl}/`);
  const isAuthRequest =
    requestUrl === `${apiBaseUrl}/auth/login` || requestUrl === `${apiBaseUrl}/auth/refresh`;

  if (!isApiRequest || isAuthRequest) {
    return next(request);
  }

  const accessToken = authStore.accessToken();

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

      if (request.context.get(REFRESH_RETRY) || !authStore.refreshToken()) {
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
