import { TestBed } from '@angular/core/testing';

import { AuthSession } from '../models/auth.models';
import {
  AUTH_ACCESS_TOKEN_COOKIE,
  AUTH_REFRESH_TOKEN_COOKIE,
  AUTH_USER_COOKIE,
  BrowserAuthSessionCookieService,
} from './browser-auth-session-cookie.service';

describe('BrowserAuthSessionCookieService', () => {
  let storage: BrowserAuthSessionCookieService;

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

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [BrowserAuthSessionCookieService] });
    storage = TestBed.inject(BrowserAuthSessionCookieService);
    clearCookies();
  });

  afterEach(clearCookies);

  it('round-trips a valid session through separate cookies', () => {
    storage.write(session);

    expect(storage.read()).toEqual(session);
    expect(document.cookie).toContain(`${AUTH_ACCESS_TOKEN_COOKIE}=access-token`);
    expect(document.cookie).toContain(`${AUTH_REFRESH_TOKEN_COOKIE}=refresh-token`);
    expect(document.cookie).toContain(AUTH_USER_COOKIE);
  });

  it('rejects and removes malformed user data', () => {
    setCookie(AUTH_ACCESS_TOKEN_COOKIE, session.accessToken);
    setCookie(AUTH_REFRESH_TOKEN_COOKIE, session.refreshToken);
    setCookie(AUTH_USER_COOKIE, '{invalid-json');

    expect(storage.read()).toBeNull();
    expect(document.cookie).not.toContain(AUTH_ACCESS_TOKEN_COOKIE);
    expect(document.cookie).not.toContain(AUTH_REFRESH_TOKEN_COOKIE);
    expect(document.cookie).not.toContain(AUTH_USER_COOKIE);
  });

  it('rejects and removes a value that does not match the session model', () => {
    setCookie(AUTH_ACCESS_TOKEN_COOKIE, session.accessToken);
    setCookie(AUTH_REFRESH_TOKEN_COOKIE, session.refreshToken);
    setCookie(AUTH_USER_COOKIE, JSON.stringify({ id: 1 }));

    expect(storage.read()).toBeNull();
    expect(document.cookie).not.toContain(AUTH_USER_COOKIE);
  });

  it('clears all auth cookies', () => {
    storage.write(session);

    storage.clear();

    expect(storage.read()).toBeNull();
    expect(document.cookie).not.toContain(AUTH_ACCESS_TOKEN_COOKIE);
    expect(document.cookie).not.toContain(AUTH_REFRESH_TOKEN_COOKIE);
    expect(document.cookie).not.toContain(AUTH_USER_COOKIE);
  });

  function setCookie(name: string, value: string): void {
    document.cookie = `${name}=${encodeURIComponent(value)}; Path=/`;
  }

  function clearCookies(): void {
    for (const name of [AUTH_ACCESS_TOKEN_COOKIE, AUTH_REFRESH_TOKEN_COOKIE, AUTH_USER_COOKIE]) {
      document.cookie = `${name}=; Max-Age=0; Path=/`;
    }
  }
});
