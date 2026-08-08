# Application layout

The layout is the global visual shell. `AppLayout` renders the Header, a `RouterOutlet`, and the Footer in that order.

## Components

- `app-layout/` — shell composition only; it does not own feature data.
- `header/` — brand, global navigation, authenticated search, cart badge, and account menu.
- `footer/` — global footer presentation.

Header subcomponents are kept close to Header because they are shell concerns:

- `primary-navigation` renders Home and Products links.
- `product-search` owns the debounced URL navigation for the global product search.
- `account-menu` owns theme switching, outside-click/Escape close behavior, and logout intent.

## Responsive rule

Desktop keeps the full brand/navigation/search/actions row. On compact screens, feature links and the brand wordmark collapse while the search is explicitly centered and cart/account actions remain at the trailing edge. Layout styles consume the shared token layer.

Do not place product grid or login form markup in this folder. Those belong to their feature pages.
