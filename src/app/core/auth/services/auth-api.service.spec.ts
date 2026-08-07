import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { API_BASE_URL } from '../../config/api.config';
import { AuthCredentials, AuthLoginResponse, AuthSession, AuthTokens } from '../models/auth.models';
import { AuthApiService } from './auth-api.service';

describe('AuthApiService', () => {
  let service: AuthApiService;
  let httpTesting: HttpTestingController;

  const credentials: AuthCredentials = {
    username: 'emilys',
    password: 'emilyspass',
  };

  const loginResponse: AuthLoginResponse = {
    id: 1,
    username: 'emilys',
    email: 'emily.johnson@x.dummyjson.com',
    firstName: 'Emily',
    lastName: 'Johnson',
    gender: 'female',
    image: 'https://example.test/emily.png',
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AuthApiService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: 'https://api.example.test/' },
      ],
    });

    service = TestBed.inject(AuthApiService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('posts credentials and maps the flat login response into a session', () => {
    let actualSession: AuthSession | undefined;

    service.login(credentials).subscribe((session) => (actualSession = session));

    const request = httpTesting.expectOne('https://api.example.test/auth/login');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(credentials);

    request.flush(loginResponse);

    expect(actualSession).toEqual({
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
    });
  });

  it('posts the refresh token and returns the replacement token pair', () => {
    const tokens: AuthTokens = {
      accessToken: 'replacement-access-token',
      refreshToken: 'replacement-refresh-token',
    };
    let actualTokens: AuthTokens | undefined;

    service.refresh('current-refresh-token').subscribe((value) => (actualTokens = value));

    const request = httpTesting.expectOne('https://api.example.test/auth/refresh');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ refreshToken: 'current-refresh-token' });

    request.flush(tokens);

    expect(actualTokens).toEqual(tokens);
  });
});
