import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { EMPTY, Observable, Subject, throwError } from 'rxjs';

import { AuthTokens } from '../models/auth.models';
import { AuthStore } from '../stores/auth.store';
import { AuthApiService } from './auth-api.service';
import { AuthRefreshCoordinator } from './auth-refresh-coordinator.service';

class AuthApiStub {
  readonly refresh = vi.fn((_refreshToken: string): Observable<AuthTokens> => EMPTY);
}

class AuthStoreStub {
  readonly refreshToken = signal<string | null>('refresh-token');
  readonly updateTokens = vi.fn((tokens: AuthTokens): void => {
    this.refreshToken.set(tokens.refreshToken);
  });
  readonly logout = vi.fn((): void => {
    this.refreshToken.set(null);
  });
}

describe('AuthRefreshCoordinator', () => {
  let authApi: AuthApiStub;
  let authStore: AuthStoreStub;
  let coordinator: AuthRefreshCoordinator;

  beforeEach(() => {
    authApi = new AuthApiStub();
    authStore = new AuthStoreStub();

    TestBed.configureTestingModule({
      providers: [
        AuthRefreshCoordinator,
        { provide: AuthApiService, useValue: authApi },
        { provide: AuthStore, useValue: authStore },
      ],
    });

    coordinator = TestBed.inject(AuthRefreshCoordinator);
  });

  it('shares one refresh request between concurrent subscribers', () => {
    const response = new Subject<AuthTokens>();
    const accessTokens: string[] = [];
    authApi.refresh.mockReturnValue(response);

    const firstRefresh = coordinator.refreshAccessToken();
    const secondRefresh = coordinator.refreshAccessToken();

    expect(firstRefresh).toBe(secondRefresh);
    expect(authApi.refresh).toHaveBeenCalledOnce();
    expect(authApi.refresh).toHaveBeenCalledWith('refresh-token');

    firstRefresh.subscribe((token) => accessTokens.push(token));
    secondRefresh.subscribe((token) => accessTokens.push(token));

    response.next({
      accessToken: 'replacement-access-token',
      refreshToken: 'replacement-refresh-token',
    });
    response.complete();

    expect(accessTokens).toEqual(['replacement-access-token', 'replacement-access-token']);
    expect(authStore.updateTokens).toHaveBeenCalledOnce();
  });

  it('clears the session when refresh fails', () => {
    const refreshError = new Error('Refresh failed');
    let actualError: unknown;
    authApi.refresh.mockReturnValue(throwError(() => refreshError));

    coordinator.refreshAccessToken().subscribe({
      error: (error: unknown) => (actualError = error),
    });

    expect(actualError).toBe(refreshError);
    expect(authStore.logout).toHaveBeenCalledOnce();
  });

  it('does not call the API when no refresh token exists', () => {
    let actualError: unknown;
    authStore.refreshToken.set(null);

    coordinator.refreshAccessToken().subscribe({
      error: (error: unknown) => (actualError = error),
    });

    expect(actualError).toBeInstanceOf(Error);
    expect(authApi.refresh).not.toHaveBeenCalled();
    expect(authStore.logout).toHaveBeenCalledOnce();
  });
});
