import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { API_BASE_URL } from '../../../core/config/api.config';
import { Product, ProductCategory, ProductsResponse } from '../models/product.models';
import { ProductsApiService } from './products-api.service';

describe('ProductsApiService', () => {
  let service: ProductsApiService;
  let httpTesting: HttpTestingController;

  const response: ProductsResponse = {
    products: [],
    total: 0,
    skip: 18,
    limit: 9,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ProductsApiService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: 'https://api.example.test/' },
      ],
    });

    service = TestBed.inject(ProductsApiService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('loads a paginated product page', () => {
    let actual: ProductsResponse | undefined;

    service.getProducts({ limit: 9, skip: 18 }).subscribe((value) => (actual = value));

    const request = httpTesting.expectOne(
      (candidate) => candidate.url === 'https://api.example.test/products',
    );

    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('limit')).toBe('9');
    expect(request.request.params.get('skip')).toBe('18');

    request.flush(response);

    expect(actual).toEqual(response);
  });

  it('sends the search query with pagination', () => {
    service.searchProducts('iPhone 12', { limit: 9, skip: 0 }).subscribe();

    const request = httpTesting.expectOne(
      (candidate) => candidate.url === 'https://api.example.test/products/search',
    );

    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('q')).toBe('iPhone 12');
    expect(request.request.params.get('limit')).toBe('9');
    expect(request.request.params.get('skip')).toBe('0');

    request.flush({ ...response, skip: 0 });
  });

  it('sends sortBy and order for sorted product requests', () => {
    service.getProducts({ limit: 9, skip: 0 }, { sortBy: 'title', order: 'asc' }).subscribe();

    const request = httpTesting.expectOne(
      (candidate) => candidate.url === 'https://api.example.test/products',
    );

    expect(request.request.params.get('sortBy')).toBe('title');
    expect(request.request.params.get('order')).toBe('asc');
    request.flush({ ...response, skip: 0 });
  });

  it('encodes a category slug and sends pagination', () => {
    service.getProductsByCategory('smart phones', { limit: 9, skip: 9 }).subscribe();

    const request = httpTesting.expectOne(
      (candidate) => candidate.url === 'https://api.example.test/products/category/smart%20phones',
    );

    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('limit')).toBe('9');
    expect(request.request.params.get('skip')).toBe('9');

    request.flush({ ...response, skip: 9 });
  });

  it('loads category metadata without waiting for product counts', () => {
    const categories: readonly ProductCategory[] = [
      {
        slug: 'smartphones',
        name: 'Smartphones',
        url: 'https://api.example.test/products/category/smartphones',
      },
    ];
    let actual: readonly ProductCategory[] | undefined;

    service.getCategories().subscribe((value) => (actual = value));

    const request = httpTesting.expectOne('https://api.example.test/products/categories');
    expect(request.request.method).toBe('GET');

    request.flush(categories);

    expect(actual).toEqual(categories);
    expect(
      httpTesting.match((candidate) => candidate.url === 'https://api.example.test/products'),
    ).toHaveLength(0);
  });

  it('loads category counts as a separate optional request', () => {
    let actual: ReadonlyMap<string, number> | undefined;

    service.getCategoryCounts().subscribe((value) => (actual = value));

    const request = httpTesting.expectOne(
      (candidate) => candidate.url === 'https://api.example.test/products',
    );
    expect(request.request.params.get('limit')).toBe('0');
    expect(request.request.params.get('skip')).toBe('0');

    request.flush({
      products: [createProduct(1, 'smartphones'), createProduct(2, 'smartphones')],
      total: 2,
      skip: 0,
      limit: 0,
    });

    expect(actual).toEqual(new Map([['smartphones', 2]]));
  });

  function createProduct(id: number, category: string): Product {
    return {
      id,
      title: 'Example',
      description: 'Example description',
      category,
      price: 10,
      discountPercentage: 5,
      rating: 4,
      stock: 10,
      tags: [],
      thumbnail: 'https://example.test/thumbnail.png',
      images: ['https://example.test/image.png'],
    };
  }
});
