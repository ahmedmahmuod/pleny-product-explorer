# Shared UI component guide

All components in this folder are standalone, `ChangeDetectionStrategy.OnPush`, signal-first components. Import the component class directly in the consuming standalone component; there is no shared NgModule.

```ts
@Component({
  imports: [Button, TextField],
  // ...
})
export class ExamplePage {}
```

Components render presentation and emit user intent. They do not inject feature stores or call HTTP APIs. Tests live beside each component as `*.spec.ts`.

## Button — `app-button`

Use for actions and form submission. Button content is projected, so the parent supplies the visible label or icon content.

### Inputs

| Input             | Type                                  | Default                  | Purpose                                     |
| ----------------- | ------------------------------------- | ------------------------ | ------------------------------------------- |
| `variant`         | `'primary' \| 'secondary' \| 'ghost'` | `'primary'`              | Visual action hierarchy                     |
| `size`            | `'small' \| 'medium' \| 'large'`      | `'medium'`               | Control sizing                              |
| `type`            | `'button' \| 'submit' \| 'reset'`     | `'button'`               | Native button behavior                      |
| `disabled`        | `boolean`                             | `false`                  | Blocks interaction                          |
| `loading`         | `boolean`                             | `false`                  | Disables the button and shows progress      |
| `loadingLabel`    | `string`                              | `'Loading, please wait'` | Screen-reader loading announcement          |
| `title`           | `string \| null`                      | `null`                   | Native tooltip, useful for disabled context |
| `ariaDescribedBy` | `string \| null`                      | `null`                   | Associates additional help text             |

### Example

```html
<app-button
  type="submit"
  variant="primary"
  size="large"
  [loading]="isSubmitting()"
  loadingLabel="Signing you in"
>
  Sign in
</app-button>
```

Loading automatically sets `disabled`, `aria-busy="true"`, keeps the original label visible, and announces the supplied loading label through a polite live region. The component forwards native click events; the parent owns the action.

## TextField — `app-text-field`

Use for a labeled single-line native input. It implements Angular Signal Forms' `FormValueControl<string>` contract and exposes a model input/output through `[(value)]`.

### Inputs and model

| API            | Type                                                            | Default   | Purpose                              |
| -------------- | --------------------------------------------------------------- | --------- | ------------------------------------ |
| `label`        | `string`                                                        | required  | Visible accessible label             |
| `id`           | `string \| null`                                                | generated | Stable input/label association       |
| `name`         | `string`                                                        | `''`      | Native form name                     |
| `type`         | `'text' \| 'email' \| 'password' \| 'search' \| 'tel' \| 'url'` | `'text'`  | Native input type                    |
| `autocomplete` | supported autocomplete value or `null`                          | `null`    | Browser autofill hint                |
| `placeholder`  | `string \| null`                                                | `null`    | Native placeholder                   |
| `hint`         | `string \| null`                                                | `null`    | Non-error supporting text            |
| `error`        | `string \| null`                                                | `null`    | Validation/server message            |
| `required`     | `boolean`                                                       | `false`   | Native required semantics and marker |
| `disabled`     | `boolean`                                                       | `false`   | Native disabled semantics            |
| `value`        | `model<string>`                                                 | `''`      | Two-way field value                  |

### Example

```html
<app-text-field
  label="Username"
  name="username"
  autocomplete="username"
  [error]="usernameError()"
  [(value)]="username"
  required
/>
```

The component generates an ID when one is not supplied. The label uses `for`, and the input uses `aria-describedby` for either the hint or error (error takes precedence) plus `aria-invalid="true"` when invalid. A reserved message slot keeps surrounding form layout stable when validation text appears. `focus()` is available for form-level error recovery.

## Breadcrumb — `app-breadcrumb`

Use for semantic route context. The component does not inspect the router or create feature labels; the parent supplies typed items.

```ts
readonly breadcrumbItems = [
  { id: 'home', label: 'Home', route: '/home' },
  { id: 'products', label: 'Products', current: true },
] as const;
```

```html
<app-breadcrumb [items]="breadcrumbItems" ariaLabel="Product path" />
```

`BreadcrumbItem` fields are `id`, `label`, optional `route`, optional `queryParams`, and optional `current`. Routed non-current items become links; the current item becomes a span with `aria-current="page"`. Separators are hidden from assistive technology.

## Pagination — `app-pagination`

Use as a pure page-window control. It does not inject Router or know query-parameter names; the parent handles the emitted page and updates its URL/state.

### Inputs and output

| API           | Type             | Default           | Purpose                                 |
| ------------- | ---------------- | ----------------- | --------------------------------------- |
| `currentPage` | `number`         | required          | Current page, 1-based                   |
| `totalPages`  | `number`         | required          | Total available pages                   |
| `ariaLabel`   | `string`         | `'Product pages'` | Navigation landmark label               |
| `pageChange`  | `output<number>` | —                 | Emits a valid page selected by the user |

```html
<app-pagination
  [currentPage]="query().page"
  [totalPages]="totalPages()"
  (pageChange)="changePage($event)"
/>
```

Previous/next controls disable at the edges. The current page has `aria-current="page"` and is disabled to avoid redundant navigation. Large ranges use ellipses and every repeated item has a stable `track` key. A zero-page result renders no navigation.

## ProductCard — `app-product-card`

Use for product presentation. It accepts a small `ProductCardItem` contract instead of importing the Products feature model, which keeps the shared boundary independent.

### Inputs and output

| API           | Type              | Default  | Purpose                                 |
| ------------- | ----------------- | -------- | --------------------------------------- |
| `product`     | `ProductCardItem` | required | Display data and product image          |
| `adding`      | `boolean`         | `false`  | Shows action loading state              |
| `inCart`      | `boolean`         | `false`  | Disables duplicate add and explains why |
| `addDisabled` | `boolean`         | `false`  | Parent-controlled action disable        |
| `addToCart`   | `output<number>`  | —        | Emits product ID intent                 |

`ProductCardItem` requires `id`, `title`, `description`, `category`, `price`, `discountPercentage`, `rating`, `stock`, and `thumbnail`; `brand` and `reviews` are optional.

```html
<app-product-card
  [product]="product"
  [adding]="cartStore.isProductAdding(product.id)"
  [inCart]="cartStore.isProductInCart(product.id)"
  (addToCart)="addToCart($event)"
/>
```

The card calculates discounted price and accessible price/rating labels. Images include useful alt text, intrinsic dimensions, lazy loading, and async decoding. The action is disabled for loading, out-of-stock, already-in-cart, or parent-disabled states; the parent owns the cart request.

## CartBadge — `app-cart-badge`

Use for a compact global cart counter. It is presentational and does not load cart data.

| Input     | Type                  | Default   | Purpose                                               |
| --------- | --------------------- | --------- | ----------------------------------------------------- |
| `count`   | `number`              | `0`       | Displayed quantity; negative values normalize to zero |
| `loading` | `boolean`             | `false`   | Exposes `aria-busy="true"` while initializing         |
| `label`   | `string \| undefined` | generated | Optional custom accessible label                      |

```html
<app-cart-badge [count]="cartStore.totalQuantity()" [loading]="cartStore.isLoading()" />
```

Without a custom label it announces `Cart, 0 items`, `Cart, 1 item`, or the plural equivalent. The icon is decorative because the wrapper supplies the accessible name.

## Styling and accessibility contract

- Consume tokens from `src/assets/styles/_tokens.scss`; do not introduce component-specific hex colors or arbitrary spacing when a token exists.
- Preserve visible `:focus-visible` states and native keyboard behavior.
- Keep labels, descriptions, `aria-invalid`, `aria-current`, and live regions intact when changing markup.
- Use native controls where possible. Do not replace buttons or links with clickable `div` elements.
- Keep loading/disabled states explicit and test the semantic attributes, not only CSS classes.

## Testing checklist

Each component's adjacent spec should cover its behavior contract:

- Button: native type, variants/sizes, disabled and loading semantics, announcement, click blocking.
- TextField: label association, model updates, generated IDs, hint/error precedence, invalid semantics, focus.
- Breadcrumb: links, separators, current item, accessible nav label.
- Pagination: page window, edge disabling, current semantics, emitted page changes.
- ProductCard: content/price/rating labels, image alt/dimensions, add intent, disabled/loading/cart states.
- CartBadge: singular/plural labels, negative normalization, loading semantics.
