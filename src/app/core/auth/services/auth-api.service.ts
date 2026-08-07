import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { API_BASE_URL } from '../../config/api.config';
import {
  AuthCredentials,
  AuthLoginResponse,
  AuthRefreshRequest,
  AuthSession,
  AuthTokens,
} from '../models/auth.models';

@Injectable({ providedIn: 'root' })
export class AuthApiService {
  private readonly http = inject(HttpClient);
  private readonly authUrl = `${inject(API_BASE_URL).replace(/\/+$/, '')}/auth`;

  login(credentials: AuthCredentials): Observable<AuthSession> {
    return this.http.post<AuthLoginResponse>(`${this.authUrl}/login`, credentials).pipe(
      map(({ accessToken, refreshToken, ...user }) => ({
        user,
        accessToken,
        refreshToken,
      })),
    );
  }

  refresh(refreshToken: string): Observable<AuthTokens> {
    const request: AuthRefreshRequest = { refreshToken };

    return this.http.post<AuthTokens>(`${this.authUrl}/refresh`, request);
  }
}
