import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter, Router, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { Observable, of } from 'rxjs';

import { routes } from '../../../../app.routes';
import { AuthStore } from '../../../../core/auth/data-access/auth.store';
import { AppLayout } from '../../../../core/layout/app-layout/app-layout';
import { ProductsApiService } from '../../data-access/products-api.service';
import { ProductsStore } from '../../data-access/products.store';
import { PRODUCTS_PAGE_SIZE } from '../../models/product-query.models';
import {
  Product,
  ProductCategory,
  ProductPagination,
  ProductsResponse,
} from '../../models/product.models';
import { ProductsPage } from './products';

class AuthStoreStub {
  readonly isAuthenticated = signal(true);
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);
  readonly login = vi.fn();
}

class ProductsApiStub {
  readonly categoryProducts = Array.from({ length: 20 }, (_, index) =>
    createProduct(index + 1, `Phone ${index + 1}`),
  );
  readonly getProducts = vi.fn((pagination: ProductPagination): Observable<ProductsResponse> =>
    of(productsResponse([], 20, pagination)),
  );
  readonly searchProducts = vi.fn(
    (_search: string, pagination: ProductPagination): Observable<ProductsResponse> =>
      of(productsResponse([], 20, pagination)),
  );
  readonly getProductsByCategory = vi.fn(
    (_category: string, pagination: ProductPagination): Observable<ProductsResponse> =>
      of(productsResponse(this.categoryProducts, this.categoryProducts.length, pagination)),
  );
  readonly getCategories = vi.fn((): Observable<readonly ProductCategory[]> => of([]));
}

describe('ProductsPage URL state', () => {
  let authStore: AuthStoreStub;
  let productsApi: ProductsApiStub;
  let harness: RouterTestingHarness;

  beforeEach(async () => {
    authStore = new AuthStoreStub();
    productsApi = new ProductsApiStub();

    TestBed.configureTestingModule({
      providers: [
        provideRouter(routes, withComponentInputBinding()),
        { provide: AuthStore, useValue: authStore },
        { provide: ProductsApiService, useValue: productsApi },
      ],
    });

    harness = await RouterTestingHarness.create();
  });

  it('protects the real lazy products route and preserves its return URL', async () => {
    authStore.isAuthenticated.set(false);

    await navigate('/products?page=2');

    expect(TestBed.inject(Router).url).toBe('/login?returnUrl=%2Fproducts%3Fpage%3D2');
    expect(productsApi.getProducts).not.toHaveBeenCalled();
  });

  it('loads a direct URL from normalized signal inputs and replaces its non-canonical spelling', async () => {
    await navigate('/products?page=02&search=%20phone%20&category=SmartPhones');

    const page = activeProductsPage();
    const store = TestBed.inject(ProductsStore);

    expect(page.page()).toBe('2');
    expect(page.search()).toBe('phone');
    expect(page.category()).toBe('smartphones');
    expect(store.query()).toEqual({ page: 2, search: 'phone', category: 'smartphones' });
    expect(productsApi.getProductsByCategory).toHaveBeenCalledOnce();
    expect(productsApi.getProductsByCategory).toHaveBeenCalledWith('smartphones', {
      limit: 0,
      skip: 0,
    });
    expect(TestBed.inject(Router).url).toBe('/products?page=2&search=phone&category=smartphones');
  });

  it('normalizes invalid or empty parameters without making a duplicate request', async () => {
    await navigate('/products?page=invalid&search=%20%20&category=%20');

    expect(TestBed.inject(ProductsStore).query()).toEqual({
      page: 1,
      search: '',
      category: '',
    });
    expect(productsApi.getProducts).toHaveBeenCalledOnce();
    expect(productsApi.getProducts).toHaveBeenCalledWith({
      limit: PRODUCTS_PAGE_SIZE,
      skip: 0,
    });
    expect(TestBed.inject(Router).url).toBe('/products?page=1');
  });

  it('replaces an out-of-range page after the response reveals the last page', async () => {
    await navigate('/products?page=99');

    expect(TestBed.inject(Router).url).toBe('/products?page=3');
    expect(productsApi.getProducts).toHaveBeenNthCalledWith(1, {
      limit: PRODUCTS_PAGE_SIZE,
      skip: PRODUCTS_PAGE_SIZE * 98,
    });
    expect(productsApi.getProducts).toHaveBeenNthCalledWith(2, {
      limit: PRODUCTS_PAGE_SIZE,
      skip: PRODUCTS_PAGE_SIZE * 2,
    });
    expect(TestBed.inject(ProductsStore).query().page).toBe(3);
  });

  it('reloads when browser history restores earlier and later URL states', async () => {
    await navigate('/products?page=1');
    await navigate('/products?page=2');

    await navigate('/products?page=1');
    expect(TestBed.inject(Router).url).toBe('/products?page=1');
    expect(TestBed.inject(ProductsStore).query().page).toBe(1);

    await navigate('/products?page=2');
    expect(TestBed.inject(Router).url).toBe('/products?page=2');
    expect(TestBed.inject(ProductsStore).query().page).toBe(2);

    expect(productsApi.getProducts).toHaveBeenCalledTimes(4);
  });

  async function navigate(url: string): Promise<void> {
    await harness.navigateByUrl(url, AppLayout);
    harness.detectChanges();
    await harness.fixture.whenStable();
    harness.detectChanges();
  }

  function activeProductsPage(): ProductsPage {
    return harness.fixture.debugElement.query(By.directive(ProductsPage))
      .componentInstance as ProductsPage;
  }
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
    tags: ['phone'],
    brand: 'Example',
    thumbnail: `https://example.test/products/${id}/thumbnail.png`,
    images: [`https://example.test/products/${id}/image.png`],
  };
}

function productsResponse(
  products: readonly Product[],
  total: number,
  pagination: ProductPagination,
): ProductsResponse {
  return {
    products,
    total,
    skip: pagination.skip,
    limit: pagination.limit,
  };
}
