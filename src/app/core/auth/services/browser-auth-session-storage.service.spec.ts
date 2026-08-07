import { TestBed } from '@angular/core/testing';

import { AuthSession } from '../models/auth.models';
import {
  AUTH_SESSION_STORAGE_KEY,
  BrowserAuthSessionStorage,
} from './browser-auth-session-storage.service';

describe('BrowserAuthSessionStorage', () => {
  let storage: BrowserAuthSessionStorage;

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
    TestBed.configureTestingModule({ providers: [BrowserAuthSessionStorage] });
    storage = TestBed.inject(BrowserAuthSessionStorage);
    localStorage.clear();
  });

  afterEach(() => localStorage.clear());

  it('round-trips a valid session', () => {
    storage.write(session);

    expect(storage.read()).toEqual(session);
  });

  it('rejects and removes malformed JSON', () => {
    localStorage.setItem(AUTH_SESSION_STORAGE_KEY, '{invalid-json');

    expect(storage.read()).toBeNull();
    expect(localStorage.getItem(AUTH_SESSION_STORAGE_KEY)).toBeNull();
  });

  it('rejects and removes a value that does not match the session model', () => {
    localStorage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify({ accessToken: 'access-token' }));

    expect(storage.read()).toBeNull();
    expect(localStorage.getItem(AUTH_SESSION_STORAGE_KEY)).toBeNull();
  });

  it('clears the persisted session', () => {
    storage.write(session);

    storage.clear();

    expect(storage.read()).toBeNull();
  });
});
