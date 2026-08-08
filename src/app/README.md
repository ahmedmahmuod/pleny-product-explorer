# Application overview

This directory contains the standalone Angular application. It is intentionally split by ownership so that infrastructure, business features, and reusable presentation code remain easy to find.

## Runtime entry points

- `app.ts` is the root shell and renders the router outlet.
- `app.config.ts` provides router, HTTP, zoneless change detection, and application-wide providers.
- `app.routes.ts` defines lazy route boundaries and protects product browsing.
- `core/layout/app-layout` supplies the authenticated/public shell with Header, Router Outlet, and Footer.

## Folder ownership

| Folder      | Responsibility                                                   | May depend on                          |
| ----------- | ---------------------------------------------------------------- | -------------------------------------- |
| `core/`     | Singleton infrastructure and application-wide concerns           | `shared/`, framework APIs              |
| `features/` | Business journeys and feature-specific data/UI                   | `core/`, `shared/`, feature-local code |
| `shared/`   | Reusable UI, utilities, and contracts with no business ownership | framework APIs and design tokens       |

The dependency direction is one-way: feature pages compose shared UI and call core services/stores; shared UI must not import feature stores or APIs.

## Adding a new feature

1. Add a folder under `features/<feature-name>`.
2. Create only the subfolders needed by that feature (`pages`, `components`, `data-access`, `models`, or `utils`).
3. Keep route-level orchestration in a page component and keep reusable visual pieces presentational.
4. Move code to `shared/` only after it has a genuine second consumer and no feature-specific meaning.
5. Add tests next to the file under test and update the relevant overview document.

All components are standalone, OnPush, and use signal-based component APIs. Templates use Angular built-in control flow rather than structural directive syntax.
