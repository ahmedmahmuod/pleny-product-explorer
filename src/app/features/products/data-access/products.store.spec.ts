import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { EMPTY, Observable, of, Subject, throwError } from 'rxjs';

import { ProductSort, PRODUCTS_PAGE_SIZE } from '../models/product-query.models';
import {
  Product,
  ProductCategory,
  ProductPagination,
  ProductsResponse,
} from '../models/product.models';
import { ProductsApiService } from './products-api.service';
import { ProductsStore } from './products.store';

class ProductsApiStub {
  readonly getProducts = vi.fn(
    (_pagination: ProductPagination, _sort?: ProductSort): Observable<ProductsResponse> => EMPTY,
  );
  readonly searchProducts = vi.fn(
    (
      _search: string,
      _pagination: ProductPagination,
      _sort?: ProductSort,
    ): Observable<ProductsResponse> => EMPTY,
  );
  readonly getProductsByCategory = vi.fn(
    (
      _category: string,
      _pagination: ProductPagination,
      _sort?: ProductSort,
    ): Observable<ProductsResponse> => EMPTY,
  );
  readonly getCategories = vi.fn((): Observable<readonly ProductCategory[]> => EMPTY);
}

describe('ProductsStore', () => {
  let productsApi: ProductsApiStub;

  function createStore(): InstanceType<typeof ProductsStore> {
    productsApi = new ProductsApiStub();

    TestBed.configureTestingModule({
      providers: [ProductsStore, { provide: ProductsApiService, useValue: productsApi }],
    });

    return TestBed.inject(ProductsStore);
  }

  it('starts with an empty normalized read model', () => {
    const store = createStore();

    expect(store.products()).toEqual([]);
    expect(store.total()).toBe(0);
    expect(store.totalPages()).toBe(0);
    expect(store.query()).toEqual({
      page: 1,
      search: '',
      category: '',
      sortBy: 'rating',
      order: 'desc',
    });
    expect(store.isLoading()).toBe(false);
    expect(store.error()).toBeNull();
  });

  it('loads a page and derives its total page count', () => {
    const store = createStore();
    const response = new Subject<ProductsResponse>();
    productsApi.getProducts.mockReturnValue(response);

    store.loadProducts({ page: 2 });

    expect(store.isLoading()).toBe(true);
    expect(store.products()).toEqual([]);
    expect(productsApi.getProducts).toHaveBeenCalledWith(
      {
        limit: PRODUCTS_PAGE_SIZE,
        skip: PRODUCTS_PAGE_SIZE,
      },
      { sortBy: 'rating', order: 'desc' },
    );

    response.next(productsResponse([createProduct(10, 'Phone')], 20, 9));
    response.complete();

    expect(store.products()).toEqual([createProduct(10, 'Phone')]);
    expect(store.total()).toBe(20);
    expect(store.totalPages()).toBe(3);
    expect(store.status()).toBe('loaded');
    expect(store.isLoading()).toBe(false);
  });

  it('normalizes a query before choosing the search endpoint', () => {
    const store = createStore();
    productsApi.searchProducts.mockReturnValue(of(productsResponse([], 0)));

    store.loadProducts({ page: 'invalid', search: '  iPhone   12  ' });

    expect(store.query()).toEqual({
      page: 1,
      search: 'iPhone 12',
      category: '',
      sortBy: 'rating',
      order: 'desc',
    });
    expect(productsApi.searchProducts).toHaveBeenCalledWith(
      'iPhone 12',
      {
        limit: PRODUCTS_PAGE_SIZE,
        skip: 0,
      },
      { sortBy: 'rating', order: 'desc' },
    );
  });

  it('loads a category page when no search is active', () => {
    const store = createStore();
    productsApi.getProductsByCategory.mockReturnValue(of(productsResponse([], 0)));

    store.loadProducts({ page: 2, category: '  SmartPhones  ' });

    expect(productsApi.getProductsByCategory).toHaveBeenCalledWith(
      'smartphones',
      {
        limit: PRODUCTS_PAGE_SIZE,
        skip: PRODUCTS_PAGE_SIZE,
      },
      { sortBy: 'rating', order: 'desc' },
    );
  });

  it('filters and paginates a full category response when both filters are active', () => {
    const store = createStore();
    const matchingProducts = Array.from({ length: 11 }, (_, index) =>
      createProduct(index + 1, `Phone ${index + 1}`),
    );
    const categoryProducts = [
      ...matchingProducts,
      {
        ...createProduct(99, 'Wireless earbuds'),
        description: 'Compact audio product',
        tags: ['audio'],
      },
    ];
    productsApi.getProductsByCategory.mockReturnValue(
      of(productsResponse(categoryProducts, categoryProducts.length, 0, 0)),
    );

    store.loadProducts({ page: 2, search: ' phone ', category: 'smartphones' });

    expect(productsApi.getProductsByCategory).toHaveBeenCalledWith(
      'smartphones',
      {
        limit: 0,
        skip: 0,
      },
      { sortBy: 'rating', order: 'desc' },
    );
    expect(productsApi.searchProducts).not.toHaveBeenCalled();
    expect(store.products()).toEqual(matchingProducts.slice(PRODUCTS_PAGE_SIZE));
    expect(store.total()).toBe(11);
    expect(store.totalPages()).toBe(2);
  });

  it('sorts locally after combined category filtering', () => {
    const store = createStore();
    productsApi.getProductsByCategory.mockReturnValue(
      of(
        productsResponse(
          [
            { ...createProduct(1, 'Phone low'), price: 10 },
            { ...createProduct(2, 'Phone high'), price: 50 },
          ],
          2,
          0,
          0,
        ),
      ),
    );

    store.loadProducts({ category: 'smartphones', search: 'phone', sortBy: 'price', order: 'asc' });

    expect(store.products().map(({ id }) => id)).toEqual([1, 2]);
    expect(productsApi.getProductsByCategory).toHaveBeenCalledWith(
      'smartphones',
      { limit: 0, skip: 0 },
      { sortBy: 'price', order: 'asc' },
    );
  });

  it('cancels an older request when a newer query arrives', () => {
    const store = createStore();
    let firstRequestCancelled = false;
    const firstRequest = new Observable<ProductsResponse>(() => () => {
      firstRequestCancelled = true;
    });
    productsApi.getProducts
      .mockReturnValueOnce(firstRequest)
      .mockReturnValueOnce(of(productsResponse([createProduct(10, 'Newest')], 1, 9)));

    store.loadProducts({ page: 1 });
    store.loadProducts({ page: 2 });

    expect(firstRequestCancelled).toBe(true);
    expect(store.query().page).toBe(2);
    expect(store.products()).toEqual([createProduct(10, 'Newest')]);
  });

  it('recovers from an error and retries the current normalized query', () => {
    const store = createStore();
    const error = new HttpErrorResponse({
      status: 500,
      error: { message: 'Products are temporarily unavailable' },
    });
    productsApi.getProducts
      .mockReturnValueOnce(throwError(() => error))
      .mockReturnValueOnce(of(productsResponse([createProduct(1, 'Phone')], 1)));

    store.loadProducts({ page: '1' });

    expect(store.status()).toBe('error');
    expect(store.error()).toBe('Products are temporarily unavailable');
    expect(store.isLoading()).toBe(false);

    store.retryProducts();

    expect(productsApi.getProducts).toHaveBeenCalledTimes(2);
    expect(store.status()).toBe('loaded');
    expect(store.error()).toBeNull();
    expect(store.products()).toEqual([createProduct(1, 'Phone')]);
  });

  it('loads categories independently and does not request them again after success', () => {
    const store = createStore();
    const categories: readonly ProductCategory[] = [
      {
        slug: 'smartphones',
        name: 'Smartphones',
        url: 'https://dummyjson.com/products/category/smartphones',
      },
    ];
    productsApi.getCategories.mockReturnValue(of(categories));

    store.loadCategories();
    store.loadCategories();

    expect(productsApi.getCategories).toHaveBeenCalledOnce();
    expect(store.categories()).toEqual(categories);
    expect(store.categoriesStatus()).toBe('loaded');
    expect(store.areCategoriesLoading()).toBe(false);
    expect(store.categoriesError()).toBeNull();
  });

  it('keeps category errors separate from loaded product results', () => {
    const store = createStore();
    productsApi.getProducts.mockReturnValue(of(productsResponse([createProduct(1, 'Phone')], 1)));
    productsApi.getCategories.mockReturnValue(throwError(() => new Error('offline')));

    store.loadProducts({});
    store.loadCategories();

    expect(store.products()).toEqual([createProduct(1, 'Phone')]);
    expect(store.status()).toBe('loaded');
    expect(store.categoriesStatus()).toBe('error');
    expect(store.categoriesError()).toBe('Unable to load categories. Please try again.');
  });
});

function createProduct(id: number, title: string): Product {
  return {
    id,
    title,
    description: `${title} description`,
    category: 'smartphones',
    price: 999,
    discountPercentage: 10,
    rating: 4.5,
    stock: 20,
    tags: ['phones'],
    brand: 'Example',
    thumbnail: `https://example.test/products/${id}/thumbnail.png`,
    images: [`https://example.test/products/${id}/image.png`],
  };
}

function productsResponse(
  products: readonly Product[],
  total: number,
  skip = 0,
  limit = PRODUCTS_PAGE_SIZE,
): ProductsResponse {
  return { products, total, skip, limit };
}
