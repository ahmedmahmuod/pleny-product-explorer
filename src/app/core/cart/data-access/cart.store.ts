import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { catchError, distinctUntilChanged, EMPTY, mergeMap, pipe, switchMap, tap } from 'rxjs';

import { AuthStore } from '../../auth/data-access/auth.store';
import { getHttpErrorMessage } from '../../../shared/utilities/http-error-message';
import { CartApiService } from './cart-api.service';

type CartStatus = 'idle' | 'loading' | 'loaded' | 'error';

interface CartState {
  readonly totalQuantity: number;
  readonly cartProductIds: readonly number[];
  readonly status: CartStatus;
  readonly addingProductIds: readonly number[];
  readonly error: string | null;
}

const initialCartState: CartState = {
  totalQuantity: 0,
  cartProductIds: [],
  status: 'idle',
  addingProductIds: [],
  error: null,
};

export const CartStore = signalStore(
  { providedIn: 'root' },
  withState(initialCartState),
  withComputed(({ status }) => ({
    isLoading: computed(() => status() === 'loading'),
  })),
  withMethods((store) => {
    const authStore = inject(AuthStore);
    const cartApi = inject(CartApiService);

    const loadCart = rxMethod<number | null>(
      pipe(
        distinctUntilChanged(),
        switchMap((userId) => {
          if (userId === null) {
            patchState(store, initialCartState);
            return EMPTY;
          }

          patchState(store, {
            totalQuantity: 0,
            cartProductIds: [],
            status: 'loading',
            addingProductIds: [],
            error: null,
          });

          return cartApi.getUserCarts(userId).pipe(
            tap(({ carts }) =>
              patchState(store, {
                totalQuantity: getTotalQuantity(carts),
                cartProductIds: getCartProductIds(carts),
                status: 'loaded',
                error: null,
              }),
            ),
            catchError((error: unknown) => {
              patchState(store, {
                status: 'error',
                error: getHttpErrorMessage(error, 'Unable to load your cart. Please try again.'),
              });
              return EMPTY;
            }),
          );
        }),
      ),
    );

    const addProduct = rxMethod<number>(
      pipe(
        mergeMap((productId) => {
          const userId = authStore.user()?.id;

          if (
            userId === undefined ||
            store.addingProductIds().includes(productId) ||
            store.cartProductIds().includes(productId)
          ) {
            return EMPTY;
          }

          patchState(store, {
            totalQuantity: store.totalQuantity() + 1,
            addingProductIds: [...store.addingProductIds(), productId],
            error: null,
          });

          return cartApi
            .addProduct({
              userId,
              products: [{ id: productId, quantity: 1 }],
            })
            .pipe(
              tap(() =>
                patchState(store, {
                  addingProductIds: removeProductId(store.addingProductIds(), productId),
                  cartProductIds: addProductId(store.cartProductIds(), productId),
                }),
              ),
              catchError((error: unknown) => {
                patchState(store, {
                  totalQuantity: Math.max(0, store.totalQuantity() - 1),
                  addingProductIds: removeProductId(store.addingProductIds(), productId),
                  error: getHttpErrorMessage(error, 'Unable to add the product to your cart.'),
                });
                return EMPTY;
              }),
            );
        }),
      ),
    );

    // The signal tracks login, logout, and refresh restoration without an
    // effect: rxMethod owns the HTTP lifecycle and cancels stale user loads.
    const userId = computed(() => authStore.user()?.id ?? null);
    loadCart(userId);

    return {
      addProduct,

      isProductAdding(productId: number): boolean {
        return store.addingProductIds().includes(productId);
      },

      isProductInCart(productId: number): boolean {
        return store.cartProductIds().includes(productId);
      },
    };
  }),
);

function getTotalQuantity(carts: readonly { products: readonly { quantity: number }[] }[]): number {
  return carts.reduce(
    (total, cart) =>
      total + cart.products.reduce((cartTotal, item) => cartTotal + item.quantity, 0),
    0,
  );
}

function getCartProductIds(
  carts: readonly { products: readonly { id: number }[] }[],
): readonly number[] {
  return [...new Set(carts.flatMap((cart) => cart.products.map(({ id }) => id)))];
}

function addProductId(productIds: readonly number[], productId: number): readonly number[] {
  return productIds.includes(productId) ? productIds : [...productIds, productId];
}

function removeProductId(productIds: readonly number[], productId: number): readonly number[] {
  return productIds.filter((currentId) => currentId !== productId);
}
