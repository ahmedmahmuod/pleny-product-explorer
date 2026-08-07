import { DOCUMENT } from '@angular/common';
import { inject, Injectable } from '@angular/core';

import type { AuthSession } from '../models/auth.models';
import { parseAuthSession } from '../utils/auth-session.parser';
import { AuthSessionStorage } from './auth-session-storage.service';

export const AUTH_SESSION_STORAGE_KEY = 'pleny.auth.session';

@Injectable()
export class BrowserAuthSessionStorage extends AuthSessionStorage {
  private readonly window = inject(DOCUMENT).defaultView;

  override read(): AuthSession | null {
    try {
      const serializedSession = this.window?.localStorage.getItem(AUTH_SESSION_STORAGE_KEY);

      if (!serializedSession) {
        return null;
      }

      const session = parseAuthSession(serializedSession);

      if (!session) {
        this.clear();
      }

      return session;
    } catch {
      // Browser privacy settings can make localStorage unavailable.
      return null;
    }
  }

  override write(session: AuthSession): void {
    try {
      this.window?.localStorage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify(session));
    } catch {
      // The in-memory session remains usable when browser storage is unavailable.
    }
  }

  override clear(): void {
    try {
      this.window?.localStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
    } catch {
      // Logout must still clear in-memory state if browser storage is unavailable.
    }
  }
}
