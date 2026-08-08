# Features overview

`features/` contains business capabilities. A feature owns the page, feature-only components, API adapter, models, and utilities needed to implement its user journey.

## Current features

- `auth/` — login screen and authentication form UX.
- `home/` — public landing page and Home route content.
- `products/` — URL-driven product browsing, search, category filtering, sorting, pagination, and product-page composition.

## Feature boundaries

- Pages are route-level smart components. They coordinate URL state, stores, navigation, and child component inputs.
- Feature components are reusable only inside that feature unless their ownership is later proven broader.
- Feature data-access services translate API calls into typed Observables; stores expose view state through signals.
- Feature models describe business/API data and should not leak into shared UI when a smaller presentational contract is sufficient.
- Tests stay next to the implementation they verify.

## Creating future features

Start with the smallest required folders. Do not create empty `components`, `utils`, or `data-access` directories. A feature may consume `core` infrastructure and `shared` UI, but it should not import another feature's private implementation.
