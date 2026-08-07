import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter, Router, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { Observable, of, Subject, throwError } from 'rxjs';

import { routes } from '../../../../app.routes';
import { AuthStore } from '../../../../core/auth/data-access/auth.store';
import { AuthUser } from '../../../../core/auth/models/auth.models';
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

@Component({
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class RouterStartPage {}

class AuthStoreStub {
  readonly isAuthenticated = signal(true);
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);
  readonly user = signal<AuthUser | null>(null);
  readonly login = vi.fn();
  readonly logout = vi.fn();
}

class ProductsApiStub {
  readonly categories: readonly ProductCategory[] = [
    {
      slug: 'smartphones',
      name: 'Smartphones',
      url: 'https://dummyjson.com/products/category/smartphones',
      count: 2,
    },
    {
      slug: 'laptops',
      name: 'Laptops',
      url: 'https://dummyjson.com/products/category/laptops',
      count: 1,
    },
  ];
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
  readonly getCategories = vi.fn((): Observable<readonly ProductCategory[]> => of(this.categories));
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
        provideRouter(
          [{ path: 'test-start', component: RouterStartPage }, ...routes],
          withComponentInputBinding(),
        ),
        { provide: AuthStore, useValue: authStore },
        { provide: ProductsApiService, useValue: productsApi },
      ],
    });

    harness = await RouterTestingHarness.create('/test-start');
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
    expect(searchInput().value).toBe('phone');
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

  it('loads category options with an accessible busy state', async () => {
    const categoriesResponse = new Subject<readonly ProductCategory[]>();
    productsApi.getCategories.mockReturnValue(categoriesResponse);

    await navigate('/products?page=1');

    expect(categoryFilter().disabled).toBe(true);
    expect(categoryFilter().getAttribute('aria-busy')).toBe('true');
    expect(routeElement().querySelector('[role="status"]')?.textContent).toContain(
      'Loading product categories',
    );

    categoriesResponse.next(productsApi.categories);
    categoriesResponse.complete();
    harness.detectChanges();

    expect(categoryFilter().disabled).toBe(false);
    expect(categoryFilter().getAttribute('aria-busy')).toBeNull();
    expect(categoryOptions()).toEqual([
      { value: '', label: 'All' },
      { value: 'smartphones', label: 'Smartphones', count: 2 },
      { value: 'laptops', label: 'Laptops', count: 1 },
    ]);
  });

  it('updates category immediately, preserves search, resets page, and combines the filters', async () => {
    await navigate('/products?page=3&search=phone');

    changeRadio('laptops');
    await harness.fixture.whenStable();
    harness.detectChanges();

    expect(TestBed.inject(Router).url).toBe('/products?page=1&search=phone&category=laptops');
    expect(checkedCategory()).toBe('laptops');
    expect(productsApi.getProductsByCategory).toHaveBeenLastCalledWith('laptops', {
      limit: 0,
      skip: 0,
    });
    expect(productsApi.getCategories).toHaveBeenCalledOnce();
  });

  it('selecting all categories removes the category while preserving search', async () => {
    await navigate('/products?page=2&search=phone&category=smartphones');

    changeRadio('');
    await harness.fixture.whenStable();
    harness.detectChanges();

    expect(TestBed.inject(Router).url).toBe('/products?page=1&search=phone');
    expect(checkedCategory()).toBe('');
    expect(productsApi.searchProducts).toHaveBeenLastCalledWith('phone', {
      limit: PRODUCTS_PAGE_SIZE,
      skip: 0,
    });
  });

  it('removes an unknown category after the valid category list loads', async () => {
    await navigate('/products?page=2&category=unknown-category');

    expect(TestBed.inject(Router).url).toBe('/products?page=2');
    expect(checkedCategory()).toBe('');
    expect(TestBed.inject(ProductsStore).query()).toEqual({
      page: 2,
      search: '',
      category: '',
    });
  });

  it('announces a category error and retries loading on request', async () => {
    productsApi.getCategories
      .mockReturnValueOnce(throwError(() => new Error('offline')))
      .mockReturnValueOnce(of(productsApi.categories));

    await navigate('/products?page=1');

    expect(routeElement().querySelector('[role="alert"]')?.textContent).toContain(
      'Unable to load categories',
    );

    retryCategoriesButton().click();
    harness.detectChanges();
    await harness.fixture.whenStable();
    harness.detectChanges();

    expect(productsApi.getCategories).toHaveBeenCalledTimes(2);
    expect(routeElement().querySelector('[role="alert"]')).toBeNull();
    expect(categoryOptions()).toHaveLength(3);
  });

  it('renders product cards and changes the page through reusable pagination', async () => {
    await navigate('/products?page=2&category=smartphones');

    expect(routeElement().querySelectorAll('app-product-card')).toHaveLength(20);

    pageButton('1').click();
    await harness.fixture.whenStable();
    harness.detectChanges();

    expect(TestBed.inject(Router).url).toBe('/products?page=1&category=smartphones');
  });

  it('keeps pagination visible for a single loaded result page', async () => {
    productsApi.getProducts.mockReturnValue(
      of(
        productsResponse([createProduct(1, 'Single page product')], 1, {
          limit: PRODUCTS_PAGE_SIZE,
          skip: 0,
        }),
      ),
    );

    await navigate('/products?page=1');

    expect(routeElement().querySelector('app-pagination nav')).not.toBeNull();
    expect(pageButton('1')).not.toBeNull();
    expect(controlButton('Previous page').disabled).toBe(true);
    expect(controlButton('Next page').disabled).toBe(true);
  });

  it('renders the header search and navigates once for rapid normalized input', async () => {
    await navigate('/products?page=3&category=smartphones');
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate');
    const input = searchInput();

    enterValue(input, 'p');
    enterValue(input, 'ph');
    enterValue(input, '  phone  ');
    await waitForSearchDebounce();

    expect(routeElement().querySelector('[aria-label="Breadcrumb"]')?.textContent).toContain(
      'Products',
    );
    expect(
      routeElement().querySelector('label[for="header-product-search"]')?.textContent,
    ).toContain('Search products');
    expect(navigateSpy).toHaveBeenCalledOnce();
    expect(navigateSpy).toHaveBeenCalledWith(['/products'], {
      queryParams: { page: '1', search: 'phone' },
      queryParamsHandling: 'merge',
    });
    expect(router.parseUrl(router.url).queryParams).toEqual({
      page: '1',
      category: 'smartphones',
      search: 'phone',
    });

    enterValue(searchInput(), 'phone');
    await waitForSearchDebounce();
    expect(navigateSpy).toHaveBeenCalledOnce();
  });

  it('cancels an in-flight search request when a newer debounced search wins', async () => {
    await navigate('/products?page=1');
    let firstRequestCancelled = false;
    productsApi.searchProducts
      .mockReturnValueOnce(
        new Observable<ProductsResponse>(() => () => {
          firstRequestCancelled = true;
        }),
      )
      .mockReturnValueOnce(of(productsResponse([], 1, { limit: PRODUCTS_PAGE_SIZE, skip: 0 })));

    enterValue(searchInput(), 'phone');
    await waitForSearchDebounce();
    expect(TestBed.inject(ProductsStore).isLoading()).toBe(true);

    enterValue(searchInput(), 'laptop');
    await waitForSearchDebounce();

    expect(firstRequestCancelled).toBe(true);
    expect(productsApi.searchProducts).toHaveBeenNthCalledWith(1, 'phone', {
      limit: PRODUCTS_PAGE_SIZE,
      skip: 0,
    });
    expect(productsApi.searchProducts).toHaveBeenNthCalledWith(2, 'laptop', {
      limit: PRODUCTS_PAGE_SIZE,
      skip: 0,
    });
    expect(TestBed.inject(ProductsStore).status()).toBe('loaded');
  });

  it('removes an empty search from the URL while preserving category and resetting page', async () => {
    await navigate('/products?page=2&search=phone&category=smartphones');

    enterValue(searchInput(), '   ');
    await waitForSearchDebounce();

    expect(TestBed.inject(Router).url).toBe('/products?page=1&category=smartphones');
    expect(TestBed.inject(ProductsStore).query()).toEqual({
      page: 1,
      search: '',
      category: 'smartphones',
    });
  });

  it('recovers after a failed search request and accepts a later term', async () => {
    await navigate('/products?page=1');
    productsApi.searchProducts
      .mockReturnValueOnce(throwError(() => new Error('offline')))
      .mockReturnValueOnce(of(productsResponse([], 1, { limit: PRODUCTS_PAGE_SIZE, skip: 0 })));

    enterValue(searchInput(), 'broken');
    await waitForSearchDebounce();
    expect(TestBed.inject(ProductsStore).status()).toBe('error');

    enterValue(searchInput(), 'working');
    await waitForSearchDebounce();

    expect(productsApi.searchProducts).toHaveBeenCalledTimes(2);
    expect(TestBed.inject(ProductsStore).query().search).toBe('working');
    expect(TestBed.inject(ProductsStore).status()).toBe('loaded');
  });

  it('keeps the outer input stream alive when URL navigation rejects', async () => {
    await navigate('/products?page=1');
    const router = TestBed.inject(Router);
    const navigateSpy = vi
      .spyOn(router, 'navigate')
      .mockRejectedValueOnce(new Error('navigation failed'))
      .mockResolvedValueOnce(true);

    enterValue(searchInput(), 'first');
    await waitForSearchDebounce();
    expect(routeElement().querySelector('[role="alert"]')?.textContent).toContain(
      'Unable to update product search',
    );

    enterValue(searchInput(), 'second');
    await waitForSearchDebounce();

    expect(navigateSpy).toHaveBeenCalledTimes(2);
    expect(routeElement().querySelector('[role="alert"]')).toBeNull();
  });

  async function navigate(url: string): Promise<void> {
    await harness.navigateByUrl(url, AppLayout);
    harness.detectChanges();
    await harness.fixture.whenStable();
    harness.detectChanges();
  }

  async function waitForSearchDebounce(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 325));
    await harness.fixture.whenStable();
    harness.detectChanges();
  }

  function routeElement(): HTMLElement {
    return harness.routeNativeElement as HTMLElement;
  }

  function searchInput(): HTMLInputElement {
    return routeElement().querySelector('input[type="search"]') as HTMLInputElement;
  }

  function categoryFilter(): HTMLFieldSetElement {
    return routeElement().querySelector('app-category-filter fieldset') as HTMLFieldSetElement;
  }

  function categoryOptions(): readonly { value: string; label: string; count?: number }[] {
    return Array.from(
      routeElement().querySelectorAll('app-category-filter input[type="radio"]'),
    ).map((input) => {
      const countText = input.parentElement?.querySelector('.category-filter__count')?.textContent;
      const count = Number.parseInt(countText?.replace(/\D/g, '') ?? '', 10);

      return {
        value: (input as HTMLInputElement).value,
        label:
          input.parentElement?.querySelector('.category-filter__label')?.textContent?.trim() ?? '',
        ...(Number.isNaN(count) ? {} : { count }),
      };
    });
  }

  function checkedCategory(): string {
    return (
      routeElement().querySelector(
        'app-category-filter input[type="radio"]:checked',
      ) as HTMLInputElement
    ).value;
  }

  function retryCategoriesButton(): HTMLButtonElement {
    return routeElement().querySelector(
      'app-category-filter .category-filter__message button',
    ) as HTMLButtonElement;
  }

  function activeProductsPage(): ProductsPage {
    return harness.fixture.debugElement.query(By.directive(ProductsPage))
      .componentInstance as ProductsPage;
  }

  function controlButton(label: string): HTMLButtonElement {
    return routeElement().querySelector(`button[aria-label="${label}"]`) as HTMLButtonElement;
  }
});

function enterValue(input: HTMLInputElement, value: string): void {
  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

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

function changeRadio(value: string): void {
  const radio = document.querySelector(
    `app-category-filter input[type="radio"][value="${value}"]`,
  ) as HTMLInputElement;
  radio.checked = true;
  radio.dispatchEvent(new Event('change', { bubbles: true }));
}

function pageButton(label: string): HTMLButtonElement {
  return Array.from(document.querySelectorAll('.pagination__page')).find(
    (button) => button.textContent?.trim() === label,
  ) as HTMLButtonElement;
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
