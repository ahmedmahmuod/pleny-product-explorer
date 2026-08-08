import { HttpErrorResponse } from '@angular/common/http';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Observable, of, Subject, throwError } from 'rxjs';

import { AuthStore } from '../../auth/data-access/auth.store';
import { AuthUser } from '../../auth/models/auth.models';
import { AddCartRequest, Cart, CartsResponse } from '../models/cart.models';
import { CartApiService } from './cart-api.service';
import { CartStore } from './cart.store';

class AuthStoreStub {
  readonly user = signal<AuthUser | null>(null);
}

class CartApiStub {
  readonly getUserCarts = vi.fn((_userId: number): Observable<CartsResponse> =>
    of({
      carts: [],
      total: 0,
      skip: 0,
      limit: 0,
    }),
  );
  readonly addProduct = vi.fn((_request: AddCartRequest): Observable<Cart> =>
    of({ userId: 7, products: [] }),
  );
}

describe('CartStore', () => {
  let authStore: AuthStoreStub;
  let cartApi: CartApiStub;

  beforeEach(() => {
    authStore = new AuthStoreStub();
    cartApi = new CartApiStub();

    TestBed.configureTestingModule({
      providers: [
        CartStore,
        { provide: AuthStore, useValue: authStore },
        { provide: CartApiService, useValue: cartApi },
      ],
    });
  });

  it('loads and sums quantities when a session user becomes available', () => {
    cartApi.getUserCarts.mockReturnValue(
      of({
        carts: [
          {
            userId: 7,
            products: [
              { id: 1, quantity: 2 },
              { id: 2, quantity: 3 },
            ],
          },
          { userId: 7, products: [{ id: 3, quantity: 1 }] },
        ],
        total: 2,
        skip: 0,
        limit: 0,
      }),
    );
    const store = TestBed.inject(CartStore);

    authStore.user.set(createUser());
    TestBed.flushEffects();

    expect(cartApi.getUserCarts).toHaveBeenCalledWith(7);
    expect(store.totalQuantity()).toBe(6);
    expect(store.status()).toBe('loaded');
    expect(store.isProductInCart(1)).toBe(true);
    expect(store.isProductInCart(99)).toBe(false);
  });

  it('increments optimistically and settles a successful add request', () => {
    const response = new Subject<Cart>();
    cartApi.addProduct.mockReturnValue(response);
    authStore.user.set(createUser());
    const store = TestBed.inject(CartStore);

    store.addProduct(12);

    expect(store.totalQuantity()).toBe(1);
    expect(store.isProductAdding(12)).toBe(true);
    expect(cartApi.addProduct).toHaveBeenCalledWith({
      userId: 7,
      products: [{ id: 12, quantity: 1 }],
    });

    response.next({ userId: 7, products: [{ id: 12, quantity: 1 }] });
    response.complete();

    expect(store.totalQuantity()).toBe(1);
    expect(store.isProductAdding(12)).toBe(false);
    expect(store.error()).toBeNull();

    store.addProduct(12);
    expect(cartApi.addProduct).toHaveBeenCalledOnce();
    expect(store.totalQuantity()).toBe(1);
  });

  it('rolls back exactly one optimistic quantity when an add fails', () => {
    cartApi.addProduct.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 500,
            error: { message: 'Cart service unavailable' },
          }),
      ),
    );
    authStore.user.set(createUser());
    const store = TestBed.inject(CartStore);

    store.addProduct(12);

    expect(store.totalQuantity()).toBe(0);
    expect(store.isProductAdding(12)).toBe(false);
    expect(store.error()).toBe('Cart service unavailable');
  });

  it('does not create duplicate requests while the same product is adding', () => {
    const response = new Subject<Cart>();
    cartApi.addProduct.mockReturnValue(response);
    authStore.user.set(createUser());
    const store = TestBed.inject(CartStore);

    store.addProduct(12);
    store.addProduct(12);

    expect(cartApi.addProduct).toHaveBeenCalledOnce();
    expect(store.totalQuantity()).toBe(1);
  });
});

function createUser(): AuthUser {
  return {
    id: 7,
    username: 'emilys',
    email: 'emily@example.test',
    firstName: 'Emily',
    lastName: 'Johnson',
    gender: 'female',
    image: 'https://example.test/emily.png',
  };
}
