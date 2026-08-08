# Authentication infrastructure

This folder owns authentication mechanics, not authentication screens. Login UI lives in `features/auth`; this separation keeps session infrastructure reusable by every protected feature.

## Responsibilities by folder

- `contracts/` — stable storage contract for reading, writing, and clearing an auth session.
- `data-access/` — typed DummyJSON auth API and the root `AuthStore`.
- `guards/` — functional route protection and return-url handling.
- `interceptors/` — access-token attachment and refresh/retry behavior for HTTP requests.
- `models/` — auth session, user, login, and refresh response contracts.
- `services/` — browser session storage and concurrent refresh coordination.
- `utils/` — parsing and normalization helpers that have no service lifecycle.

## Authentication flow

1. Login calls `AuthStore.login`, which uses the typed auth API.
2. A successful session is stored through the `AuthSessionStorage` contract, implemented in the browser with separate access-token, refresh-token, and user cookies.
3. The guard allows protected routes only when the store has an authenticated user.
4. The interceptor attaches the access token to normal API requests.
5. A 401 starts one coordinated refresh request; concurrent failed requests wait for that result.
6. The original request is retried once with the new token. Refresh failure clears the session and safely returns the user to login.

The cookie adapter uses `Path=/`, `SameSite=Lax`, a seven-day `Max-Age`, and `Secure` when the app runs over HTTPS. Because a frontend cannot set `HttpOnly`, these are still JavaScript-readable cookies; production authentication should issue secure HttpOnly cookies from the server.

The implementation is suitable for the DummyJSON assessment, but it is not a production security boundary: browser-readable tokens remain exposed to an XSS vulnerability and DummyJSON tokens are demonstration credentials.

## Extension rules

Add a new provider or helper here only when it serves authentication infrastructure. Put a new login/register/forgot-password screen under `features/auth/pages` instead.
