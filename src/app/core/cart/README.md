# Cart infrastructure

The cart is global application state because the Header displays its count while product cards initiate additions.

## Files

- `data-access/cart-api.service.ts` is the typed Carts API adapter.
- `data-access/cart.store.ts` is the root SignalStore for loading a user cart and adding products.
- `models/cart.models.ts` contains the API contracts.

## State behavior

- `totalQuantity` is the sum of item quantities returned by the user carts endpoint.
- `cartProductIds` tracks distinct products already represented in the cart.
- `addingProductIds` prevents duplicate submissions while an add request is in flight.
- Add-to-cart is optimistic: the quantity increments immediately and rolls back if the API request fails.
- A successful add marks the product as already in the cart, so the Product Card can disable the action and explain why.
- Logging out resets the cart state; logging in/restoring a session reloads the user cart.

DummyJSON simulates persistence, so the store documents UI intent rather than promising production cart durability.
