import { HttpErrorResponse } from '@angular/common/http';
import { computed, inject } from '@angular/core';
import {
  patchState,
  signalStore,
  withComputed,
  withHooks,
  withMethods,
  withState,
} from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { catchError, EMPTY, exhaustMap, finalize, pipe, tap } from 'rxjs';

import { AuthCredentials, AuthSession, AuthTokens } from '../models/auth.models';
import { AuthApiService } from '../services/auth-api.service';
import { AuthSessionStorage } from '../services/auth-session-storage.service';

type AuthStatus = 'idle' | 'loading';

interface AuthState {
  readonly session: AuthSession | null;
  readonly status: AuthStatus;
  readonly error: string | null;
}

const initialAuthState: AuthState = {
  session: null,
  status: 'idle',
  error: null,
};

export const AuthStore = signalStore(
  { providedIn: 'root' },
  withState(initialAuthState),
  withComputed(({ session, status }) => ({
    isAuthenticated: computed(() => session() !== null),
    isLoading: computed(() => status() === 'loading'),
    user: computed(() => session()?.user ?? null),
    accessToken: computed(() => session()?.accessToken ?? null),
    refreshToken: computed(() => session()?.refreshToken ?? null),
  })),
  withMethods((store) => {
    const authApi = inject(AuthApiService);
    const sessionStorage = inject(AuthSessionStorage);
    const login = rxMethod<AuthCredentials>(
      pipe(
        exhaustMap((credentials) => {
          patchState(store, { status: 'loading', error: null });

          return authApi.login(credentials).pipe(
            tap((session) => {
              sessionStorage.write(session);
              patchState(store, { session, error: null });
            }),
            catchError((error: unknown) => {
              patchState(store, { error: getLoginErrorMessage(error) });
              return EMPTY;
            }),
            finalize(() => patchState(store, { status: 'idle' })),
          );
        }),
      ),
    );

    return {
      login,

      restoreSession(): void {
        patchState(store, {
          session: sessionStorage.read(),
          status: 'idle',
          error: null,
        });
      },

      logout(): void {
        sessionStorage.clear();
        patchState(store, initialAuthState);
      },

      updateTokens(tokens: AuthTokens): void {
        const currentSession = store.session();

        if (!currentSession) {
          return;
        }

        const session: AuthSession = { ...currentSession, ...tokens };
        sessionStorage.write(session);
        patchState(store, { session });
      },
    };
  }),
  withHooks({
    onInit(store): void {
      store.restoreSession();
    },
  }),
);

function getLoginErrorMessage(error: unknown): string {
  if (error instanceof HttpErrorResponse && isRecord(error.error)) {
    const message = error.error['message'];

    if (typeof message === 'string' && message.trim()) {
      return message;
    }
  }

  return 'Unable to sign in. Please try again.';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
