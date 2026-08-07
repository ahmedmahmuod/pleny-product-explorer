import {
  HttpClient,
  HttpErrorResponse,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Observable, of } from 'rxjs';

import { API_BASE_URL } from '../../config/api.config';
import { AuthRefreshCoordinator } from '../services/auth-refresh-coordinator.service';
import { AuthStore } from '../stores/auth.store';
import { authInterceptor } from './auth.interceptor';

class AuthStoreStub {
  readonly accessToken = signal<string | null>('access-token');
  readonly refreshToken = signal<string | null>('refresh-token');
  readonly logout = vi.fn();
}

class AuthRefreshCoordinatorStub {
  readonly refreshAccessToken = vi.fn<() => Observable<string>>(() =>
    of('replacement-access-token'),
  );
}

describe('authInterceptor', () => {
  const apiBaseUrl = 'https://api.example.test';

  let http: HttpClient;
  let httpTesting: HttpTestingController;
  let authStore: AuthStoreStub;
  let refreshCoordinator: AuthRefreshCoordinatorStub;

  beforeEach(() => {
    authStore = new AuthStoreStub();
    refreshCoordinator = new AuthRefreshCoordinatorStub();

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: `${apiBaseUrl}/` },
        { provide: AuthStore, useValue: authStore },
        { provide: AuthRefreshCoordinator, useValue: refreshCoordinator },
      ],
    });

    http = TestBed.inject(HttpClient);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('attaches the access token to API requests', () => {
    http.get(`${apiBaseUrl}/products`).subscribe();

    const request = httpTesting.expectOne(`${apiBaseUrl}/products`);
    expect(request.request.headers.get('Authorization')).toBe('Bearer access-token');

    request.flush({});
  });

  it('does not attach tokens to external requests', () => {
    http.get('https://images.example.test/product.png').subscribe();

    const request = httpTesting.expectOne('https://images.example.test/product.png');
    expect(request.request.headers.has('Authorization')).toBe(false);

    request.flush({});
  });

  it.each(['/auth/login', '/auth/refresh'])(
    'does not attach tokens or refresh failures for %s',
    (path) => {
      let actualError: unknown;

      http.post(`${apiBaseUrl}${path}`, {}).subscribe({
        error: (error: unknown) => (actualError = error),
      });

      const request = httpTesting.expectOne(`${apiBaseUrl}${path}`);
      expect(request.request.headers.has('Authorization')).toBe(false);

      request.flush(null, { status: 401, statusText: 'Unauthorized' });

      expect(actualError).toBeInstanceOf(HttpErrorResponse);
      expect(refreshCoordinator.refreshAccessToken).not.toHaveBeenCalled();
      expect(authStore.logout).not.toHaveBeenCalled();
    },
  );

  it('refreshes once and retries the original request with the replacement token', () => {
    let response: { readonly id: number } | undefined;

    http
      .get<{ readonly id: number }>(`${apiBaseUrl}/products/1`)
      .subscribe((value) => (response = value));

    const initialRequest = httpTesting.expectOne(`${apiBaseUrl}/products/1`);
    expect(initialRequest.request.headers.get('Authorization')).toBe('Bearer access-token');
    initialRequest.flush(null, { status: 401, statusText: 'Unauthorized' });

    const retriedRequest = httpTesting.expectOne(`${apiBaseUrl}/products/1`);
    expect(retriedRequest.request.headers.get('Authorization')).toBe(
      'Bearer replacement-access-token',
    );
    retriedRequest.flush({ id: 1 });

    expect(refreshCoordinator.refreshAccessToken).toHaveBeenCalledOnce();
    expect(response).toEqual({ id: 1 });
  });

  it('logs out without refreshing when the refresh token is missing', () => {
    let actualError: unknown;
    authStore.refreshToken.set(null);

    http.get(`${apiBaseUrl}/products`).subscribe({
      error: (error: unknown) => (actualError = error),
    });

    const request = httpTesting.expectOne(`${apiBaseUrl}/products`);
    request.flush(null, { status: 401, statusText: 'Unauthorized' });

    expect(actualError).toBeInstanceOf(HttpErrorResponse);
    expect(refreshCoordinator.refreshAccessToken).not.toHaveBeenCalled();
    expect(authStore.logout).toHaveBeenCalledOnce();
  });

  it('logs out and surfaces a second 401 without starting another refresh', () => {
    let actualError: unknown;

    http.get(`${apiBaseUrl}/products`).subscribe({
      error: (error: unknown) => (actualError = error),
    });

    httpTesting
      .expectOne(`${apiBaseUrl}/products`)
      .flush(null, { status: 401, statusText: 'Unauthorized' });
    httpTesting
      .expectOne(`${apiBaseUrl}/products`)
      .flush(null, { status: 401, statusText: 'Still unauthorized' });

    expect(actualError).toBeInstanceOf(HttpErrorResponse);
    expect(refreshCoordinator.refreshAccessToken).toHaveBeenCalledOnce();
    expect(authStore.logout).toHaveBeenCalledOnce();
  });
});
