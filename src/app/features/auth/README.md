# Authentication feature

`features/auth` contains authentication user experience only. The current feature is the lazy-loaded login page at `pages/login`.

## Login page responsibilities

- Render username/password fields using shared `TextField` and `Button` components.
- Validate required values before submitting.
- Call the core `AuthStore` and expose loading/server-error feedback.
- Focus the first invalid field when form submission fails.
- Navigate to the preserved return URL after successful authentication.

The page does not attach tokens, parse sessions, refresh requests, or implement route protection. Those responsibilities remain in `core/auth`.

## Adding auth screens

Add a route-level page under `pages/<screen-name>`. Keep auth contracts and session mechanics in `core/auth`; create a feature-local component only when it is specific to that screen.
