# Products feature

The Products feature owns the product explorer journey. Its route-level `ProductsPage` composes the category filter, shared product cards, pagination, breadcrumb, loading/error/empty states, and URL navigation.

## Contents

- `products.ts/html/scss` — route-level smart page and responsive layout.
- `components/category-filter/` — feature-specific category radio filter and loading/error states.
- `data-access/` — typed Products API adapter and NgRx SignalStore.
- `models/` — product, category, pagination, sorting, and query contracts.
- `utils/` — query normalization, canonicalization, pagination conversion, and URL parameter helpers.

## URL is the source of truth

The page receives `page`, `search`, `category`, `sortBy`, and `order` through component input binding. Query normalization makes invalid values safe, and canonical navigation replaces invalid URLs. Search changes originate in the Header's debounced RxJS pipeline; category, sort, and page changes are route-level navigations that reset the page to one when appropriate.

Example:

`/products?page=2&search=phone&category=smartphones&sortBy=price&order=asc`

## Data flow

1. `ProductsPage` converts route inputs into a normalized query signal.
2. `ProductsStore.loadProducts` uses `rxMethod` and `switchMap`, so stale requests are superseded.
3. `ProductsApiService` selects the all-products, search, or category endpoint and passes `limit`, `skip`, `sortBy`, and `order`.
4. When search and category are combined, the store loads the category collection, filters searchable fields locally, sorts, and paginates.
5. The page maps store signals into shared presentational component inputs.

DummyJSON category metadata does not include counts. The API adapter performs one bounded complete-catalog request to enrich category counts; if that optional request fails, filtering still works.

## Adding product behavior

Keep API contracts and loading/error transitions in the data-access layer. Keep URL semantics in `ProductsPage`/`utils`. Move a visual element to `shared/ui` only when it has no product-specific business meaning.
