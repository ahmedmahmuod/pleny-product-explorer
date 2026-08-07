import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

import { AuthStore } from '../stores/auth.store';
import { getSafeAuthReturnUrl } from '../utils/auth-return-url';
import { authGuard } from './auth.guard';

@Component({
  template: 'Protected page',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class ProtectedTestPage {}

@Component({
  template: 'Login page',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class LoginTestPage {}

describe('authGuard', () => {
  const isAuthenticated = signal(false);

  beforeEach(() => {
    isAuthenticated.set(false);

    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: 'products', component: ProtectedTestPage, canActivate: [authGuard] },
          { path: 'login', component: LoginTestPage },
        ]),
        { provide: AuthStore, useValue: { isAuthenticated } },
      ],
    });
  });

  it('allows an authenticated navigation', async () => {
    isAuthenticated.set(true);
    const harness = await RouterTestingHarness.create();

    await harness.navigateByUrl('/products', ProtectedTestPage);

    expect(TestBed.inject(Router).url).toBe('/products');
  });

  it('redirects an unauthenticated navigation and preserves the internal URL', async () => {
    const harness = await RouterTestingHarness.create();

    await harness.navigateByUrl('/products?page=2', LoginTestPage);

    const router = TestBed.inject(Router);
    const redirectedUrl = router.parseUrl(router.url);

    expect(router.url).toBe('/login?returnUrl=%2Fproducts%3Fpage%3D2');
    expect(redirectedUrl.queryParams['returnUrl']).toBe('/products?page=2');
  });

  it('rejects external or protocol-relative return URLs', () => {
    expect(getSafeAuthReturnUrl('https://malicious.example')).toBe('/products');
    expect(getSafeAuthReturnUrl('//malicious.example')).toBe('/products');
    expect(getSafeAuthReturnUrl('/products?page=2')).toBe('/products?page=2');
  });
});
