import { DOCUMENT } from '@angular/common';
import { inject, Injectable } from '@angular/core';

import { AuthSessionStorage } from '../contracts/auth-session-storage';
import type { AuthSession } from '../models/auth.models';
import { parseAuthSession } from '../utils/auth-session.parser';

export const AUTH_ACCESS_TOKEN_COOKIE = 'pleny.auth.access-token';
export const AUTH_REFRESH_TOKEN_COOKIE = 'pleny.auth.refresh-token';
export const AUTH_USER_COOKIE = 'pleny.auth.user';

const AUTH_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

@Injectable()
export class BrowserAuthSessionCookieService extends AuthSessionStorage {
  private readonly document = inject(DOCUMENT);

  override read(): AuthSession | null {
    try {
      const accessToken = this.readCookie(AUTH_ACCESS_TOKEN_COOKIE);
      const refreshToken = this.readCookie(AUTH_REFRESH_TOKEN_COOKIE);
      const serializedUser = this.readCookie(AUTH_USER_COOKIE);

      if (!accessToken || !refreshToken || !serializedUser) {
        this.clear();
        return null;
      }

      const session = parseAuthSession(
        JSON.stringify({
          accessToken,
          refreshToken,
          user: JSON.parse(serializedUser),
        }),
      );

      if (!session) {
        this.clear();
      }

      return session;
    } catch {
      this.clear();
      return null;
    }
  }

  override write(session: AuthSession): void {
    try {
      this.writeCookie(AUTH_ACCESS_TOKEN_COOKIE, session.accessToken);
      this.writeCookie(AUTH_REFRESH_TOKEN_COOKIE, session.refreshToken);
      this.writeCookie(AUTH_USER_COOKIE, JSON.stringify(session.user));
    } catch {
      // The in-memory session remains usable when cookies are unavailable.
    }
  }

  override clear(): void {
    try {
      this.deleteCookie(AUTH_ACCESS_TOKEN_COOKIE);
      this.deleteCookie(AUTH_REFRESH_TOKEN_COOKIE);
      this.deleteCookie(AUTH_USER_COOKIE);
    } catch {
      // Logout must still clear in-memory state when cookie access is blocked.
    }
  }

  private readCookie(name: string): string | null {
    const cookie = this.document.cookie
      .split(';')
      .map((entry) => entry.trim())
      .find((entry) => entry.startsWith(`${name}=`));

    if (!cookie) {
      return null;
    }

    return decodeURIComponent(cookie.slice(name.length + 1));
  }

  private writeCookie(name: string, value: string): void {
    this.document.cookie = `${name}=${encodeURIComponent(value)}; Max-Age=${AUTH_COOKIE_MAX_AGE_SECONDS}; Path=/; SameSite=Lax${this.isSecureContext() ? '; Secure' : ''}`;
  }

  private deleteCookie(name: string): void {
    this.document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax${this.isSecureContext() ? '; Secure' : ''}`;
  }

  private isSecureContext(): boolean {
    return this.document.defaultView?.location.protocol === 'https:';
  }
}
