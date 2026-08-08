import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { API_BASE_URL } from '../../config/api.config';
import { CartApiService } from './cart-api.service';

describe('CartApiService', () => {
  let service: CartApiService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        CartApiService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: 'https://api.example.test/' },
      ],
    });

    service = TestBed.inject(CartApiService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('loads carts for the authenticated user', () => {
    service.getUserCarts(7).subscribe();

    const request = httpTesting.expectOne('https://api.example.test/carts/user/7');
    expect(request.request.method).toBe('GET');
    request.flush({ carts: [], total: 0, skip: 0, limit: 0 });
  });

  it('posts one product quantity to the DummyJSON add endpoint', () => {
    service.addProduct({ userId: 7, products: [{ id: 12, quantity: 1 }] }).subscribe();

    const request = httpTesting.expectOne('https://api.example.test/carts/add');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      userId: 7,
      products: [{ id: 12, quantity: 1 }],
    });
    request.flush({ userId: 7, products: [{ id: 12, quantity: 1 }] });
  });
});
