export interface AuthCredentials {
  readonly username: string;
  readonly password: string;
}

export interface AuthUser {
  readonly id: number;
  readonly username: string;
  readonly email: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly gender: string;
  readonly image: string;
}

export interface AuthTokens {
  readonly accessToken: string;
  readonly refreshToken: string;
}

export interface AuthLoginResponse extends AuthUser, AuthTokens {}

export interface AuthRefreshRequest {
  readonly refreshToken: string;
}

export interface AuthSession extends AuthTokens {
  readonly user: AuthUser;
}
