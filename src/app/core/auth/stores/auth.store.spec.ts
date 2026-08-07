import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { EMPTY, Observable, of, Subject, throwError } from 'rxjs';

import { AuthCredentials, AuthSession, AuthTokens } from '../models/auth.models';
import { AuthApiService } from '../services/auth-api.service';
import { AuthSessionStorage } from '../contracts/auth-session-storage';
import { AuthStore } from './auth.store';

class AuthApiStub {
  readonly login = vi.fn((_credentials: AuthCredentials): Observable<AuthSession> => EMPTY);
  readonly refresh = vi.fn((_refreshToken: string): Observable<AuthTokens> => EMPTY);
}

class AuthSessionStorageStub implements AuthSessionStorage {
  session: AuthSession | null = null;

  readonly read = vi.fn((): AuthSession | null => this.session);
  readonly write = vi.fn((session: AuthSession): void => {
    this.session = session;
  });
  readonly clear = vi.fn((): void => {
    this.session = null;
  });
}

describe('AuthStore', () => {
  let authApi: AuthApiStub;
  let sessionStorage: AuthSessionStorageStub;

  const credentials: AuthCredentials = {
    username: 'emilys',
    password: 'emilyspass',
  };

  const session: AuthSession = {
    user: {
      id: 1,
      username: 'emilys',
      email: 'emily.johnson@x.dummyjson.com',
      firstName: 'Emily',
      lastName: 'Johnson',
      gender: 'female',
      image: 'https://example.test/emily.png',
    },
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
  };

  function createStore(storedSession: AuthSession | null = null): InstanceType<typeof AuthStore> {
    authApi = new AuthApiStub();
    sessionStorage = new AuthSessionStorageStub();
    sessionStorage.session = storedSession;

    TestBed.configureTestingModule({
      providers: [
        AuthStore,
        { provide: AuthApiService, useValue: authApi },
        { provide: AuthSessionStorage, useValue: sessionStorage },
      ],
    });

    return TestBed.inject(AuthStore);
  }

  it('restores a persisted session when the store is initialized', () => {
    const store = createStore(session);

    expect(sessionStorage.read).toHaveBeenCalledOnce();
    expect(store.session()).toEqual(session);
    expect(store.user()).toEqual(session.user);
    expect(store.isAuthenticated()).toBe(true);
    expect(store.isLoading()).toBe(false);
  });

  it('starts unauthenticated when no session is persisted', () => {
    const store = createStore();

    expect(store.session()).toBeNull();
    expect(store.user()).toBeNull();
    expect(store.accessToken()).toBeNull();
    expect(store.refreshToken()).toBeNull();
    expect(store.isAuthenticated()).toBe(false);
  });

  it('exposes loading state, then persists a successful login', () => {
    const store = createStore();
    const response = new Subject<AuthSession>();
    authApi.login.mockReturnValue(response);

    store.login(credentials);

    expect(store.isLoading()).toBe(true);
    expect(store.error()).toBeNull();

    response.next(session);
    response.complete();

    expect(authApi.login).toHaveBeenCalledWith(credentials);
    expect(sessionStorage.write).toHaveBeenCalledWith(session);
    expect(store.session()).toEqual(session);
    expect(store.accessToken()).toBe('access-token');
    expect(store.isAuthenticated()).toBe(true);
    expect(store.isLoading()).toBe(false);
  });

  it('ignores a repeated login while the current request is active', () => {
    const store = createStore();
    const response = new Subject<AuthSession>();
    authApi.login.mockReturnValue(response);

    store.login(credentials);
    store.login(credentials);

    expect(authApi.login).toHaveBeenCalledOnce();

    response.complete();
  });

  it('recovers from a failed request and accepts a later login attempt', () => {
    const store = createStore();
    const error = new HttpErrorResponse({
      status: 400,
      error: { message: 'Invalid credentials' },
    });
    authApi.login.mockReturnValueOnce(throwError(() => error)).mockReturnValueOnce(of(session));

    store.login(credentials);

    expect(store.error()).toBe('Invalid credentials');
    expect(store.isLoading()).toBe(false);
    expect(store.isAuthenticated()).toBe(false);

    store.login(credentials);

    expect(authApi.login).toHaveBeenCalledTimes(2);
    expect(store.error()).toBeNull();
    expect(store.session()).toEqual(session);
  });

  it('updates persisted tokens without replacing the authenticated user', () => {
    const store = createStore(session);
    const tokens: AuthTokens = {
      accessToken: 'replacement-access-token',
      refreshToken: 'replacement-refresh-token',
    };

    store.updateTokens(tokens);

    expect(store.user()).toEqual(session.user);
    expect(store.accessToken()).toBe('replacement-access-token');
    expect(store.refreshToken()).toBe('replacement-refresh-token');
    expect(sessionStorage.write).toHaveBeenLastCalledWith({ ...session, ...tokens });
  });

  it('clears persisted and in-memory state on logout', () => {
    const store = createStore(session);

    store.logout();

    expect(sessionStorage.clear).toHaveBeenCalledOnce();
    expect(store.session()).toBeNull();
    expect(store.isAuthenticated()).toBe(false);
    expect(store.error()).toBeNull();
  });
});
