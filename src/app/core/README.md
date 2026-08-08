# Core overview

`core/` contains application-wide infrastructure and singleton concerns. Code here is not owned by one screen or business feature.

## Contents

- `auth/` — session contracts, authentication store/API, token interceptor, refresh coordination, and route guard.
- `cart/` — the application cart store/API used by the product page and global header.
- `config/` — injectable application configuration such as the DummyJSON base URL.
- `layout/` — the global shell, Header, Footer, and header-owned navigation/search/account UI.
- `theme/` — persisted theme state and document theme synchronization.

## Rules

- Services provided in root belong here when they represent application infrastructure.
- Guards and interceptors belong in the infrastructure area that owns their concern (`core/auth`).
- Core code may consume shared UI, but shared UI must not depend on core stores or services.
- Feature-specific rendering and feature-only API models stay under `features/`.
- Do not create a new global abstraction unless more than one feature needs it.

## Runtime pattern

Root SignalStores expose state and methods to pages/components. HTTP services remain typed request adapters. Interceptors and guards are functional and are registered from application configuration/routes.
