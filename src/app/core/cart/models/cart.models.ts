export interface CartProduct {
  readonly id: number;
  readonly quantity: number;
}

export interface Cart {
  readonly userId: number;
  readonly products: readonly CartProduct[];
}

export interface CartsResponse {
  readonly carts: readonly Cart[];
  readonly total: number;
  readonly skip: number;
  readonly limit: number;
}

export interface AddCartProduct {
  readonly id: number;
  readonly quantity: number;
}

export interface AddCartRequest {
  readonly userId: number;
  readonly products: readonly AddCartProduct[];
}
