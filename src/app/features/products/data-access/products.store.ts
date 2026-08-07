import { HttpErrorResponse } from '@angular/common/http';
import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { catchError, EMPTY, exhaustMap, map, Observable, pipe, switchMap, tap } from 'rxjs';

import {
  PRODUCTS_PAGE_SIZE,
  ProductQuery,
  ProductQueryInput,
  ProductSort,
} from '../models/product-query.models';
import { Product, ProductCategory, ProductsResponse } from '../models/product.models';
import {
  DEFAULT_PRODUCT_QUERY,
  getProductPagination,
  normalizeProductQuery,
} from '../utils/product-query';
import { ProductsApiService } from './products-api.service';

type LoadStatus = 'idle' | 'loading' | 'loaded' | 'error';

interface ProductsState {
  readonly products: readonly Product[];
  readonly total: number;
  readonly query: ProductQuery;
  readonly status: LoadStatus;
  readonly error: string | null;
  readonly categories: readonly ProductCategory[];
  readonly categoriesStatus: LoadStatus;
  readonly categoriesError: string | null;
}

const initialProductsState: ProductsState = {
  products: [],
  total: 0,
  query: DEFAULT_PRODUCT_QUERY,
  status: 'idle',
  error: null,
  categories: [],
  categoriesStatus: 'idle',
  categoriesError: null,
};

export const ProductsStore = signalStore(
  { providedIn: 'root' },
  withState(initialProductsState),
  withComputed(({ status, total, categoriesStatus }) => ({
    isLoading: computed(() => status() === 'loading'),
    totalPages: computed(() => Math.ceil(total() / PRODUCTS_PAGE_SIZE)),
    areCategoriesLoading: computed(() => categoriesStatus() === 'loading'),
  })),
  withMethods((store) => {
    const productsApi = inject(ProductsApiService);
    const loadProducts = rxMethod<ProductQueryInput>(
      pipe(
        map(normalizeProductQuery),
        switchMap((query) => {
          patchState(store, {
            query,
            products: [],
            total: 0,
            status: 'loading',
            error: null,
          });

          return getProductsRequest(productsApi, query).pipe(
            tap((response) =>
              patchState(store, {
                products: response.products,
                total: response.total,
                status: 'loaded',
                error: null,
              }),
            ),
            catchError((error: unknown) => {
              patchState(store, {
                status: 'error',
                error: getErrorMessage(error, 'Unable to load products. Please try again.'),
              });
              return EMPTY;
            }),
          );
        }),
      ),
    );

    const loadCategories = rxMethod<void>(
      pipe(
        exhaustMap(() => {
          if (store.categoriesStatus() === 'loaded') {
            return EMPTY;
          }

          patchState(store, {
            categoriesStatus: 'loading',
            categoriesError: null,
          });

          return productsApi.getCategories().pipe(
            tap((categories) =>
              patchState(store, {
                categories,
                categoriesStatus: 'loaded',
                categoriesError: null,
              }),
            ),
            catchError((error: unknown) => {
              patchState(store, {
                categoriesStatus: 'error',
                categoriesError: getErrorMessage(
                  error,
                  'Unable to load categories. Please try again.',
                ),
              });
              return EMPTY;
            }),
          );
        }),
      ),
    );

    return {
      loadProducts,
      loadCategories,

      retryProducts(): void {
        loadProducts(store.query());
      },
    };
  }),
);

function getProductsRequest(
  productsApi: ProductsApiService,
  query: ProductQuery,
): Observable<ProductsResponse> {
  const pagination = getProductPagination(query.page);
  const sort: ProductSort = { sortBy: query.sortBy, order: query.order };

  if (query.category && query.search) {
    return productsApi
      .getProductsByCategory(query.category, { limit: 0, skip: 0 }, sort)
      .pipe(map((response) => filterAndPaginate(response.products, query)));
  }

  if (query.category) {
    return productsApi.getProductsByCategory(query.category, pagination, sort);
  }

  if (query.search) {
    return productsApi.searchProducts(query.search, pagination, sort);
  }

  return productsApi.getProducts(pagination, sort);
}

function filterAndPaginate(products: readonly Product[], query: ProductQuery): ProductsResponse {
  const search = query.search.toLowerCase();
  const matches = products.filter((product) => productMatchesSearch(product, search));
  const sortedMatches = [...matches].sort((left, right) => compareProducts(left, right, query));
  const { limit, skip } = getProductPagination(query.page);

  return {
    products: sortedMatches.slice(skip, skip + limit),
    total: sortedMatches.length,
    skip,
    limit,
  };
}

function compareProducts(left: Product, right: Product, query: ProductQuery): number {
  const direction = query.order === 'asc' ? 1 : -1;

  if (query.sortBy === 'title') {
    return left.title.localeCompare(right.title) * direction;
  }

  const leftValue = left[query.sortBy];
  const rightValue = right[query.sortBy];
  return (leftValue - rightValue) * direction;
}

function productMatchesSearch(product: Product, search: string): boolean {
  return [product.title, product.description, product.brand ?? '', ...product.tags].some((value) =>
    value.toLowerCase().includes(search),
  );
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof HttpErrorResponse && isRecord(error.error)) {
    const message = error.error['message'];

    if (typeof message === 'string' && message.trim()) {
      return message;
    }
  }

  return fallback;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
