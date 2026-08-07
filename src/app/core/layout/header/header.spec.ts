import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { AuthStore } from '../../auth/data-access/auth.store';
import { AuthUser } from '../../auth/models/auth.models';
import { CartStore } from '../../cart/data-access/cart.store';
import { ThemeService } from '../../theme/theme.service';
import { AppHeader } from './header';

@Component({
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class EmptyRoutePage {}

class AuthStoreStub {
  readonly isAuthenticated = signal(false);
  readonly user = signal<AuthUser | null>(null);
  readonly logout = vi.fn();
}

class ThemeServiceStub {
  readonly isDark = signal(false);
  readonly setDarkMode = vi.fn((isDark: boolean): void => this.isDark.set(isDark));
}

class CartStoreStub {
  readonly totalQuantity = signal(0);
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);
}

describe('AppHeader', () => {
  let fixture: ComponentFixture<AppHeader>;
  let authStore: AuthStoreStub;
  let cartStore: CartStoreStub;
  let theme: ThemeServiceStub;

  beforeEach(async () => {
    authStore = new AuthStoreStub();
    cartStore = new CartStoreStub();
    theme = new ThemeServiceStub();

    TestBed.configureTestingModule({
      imports: [AppHeader],
      providers: [
        provideRouter([
          { path: 'products', component: EmptyRoutePage },
          { path: 'login', component: EmptyRoutePage },
        ]),
        { provide: AuthStore, useValue: authStore },
        { provide: CartStore, useValue: cartStore },
        { provide: ThemeService, useValue: theme },
      ],
    });

    fixture = TestBed.createComponent(AppHeader);
    fixture.detectChanges();
  });

  it('shows login and hides authenticated actions for a signed-out user', () => {
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('a[href="/login"]')?.textContent).toContain('Log in');
    expect(element.querySelector('input[type="search"]')).toBeNull();
    expect(element.querySelector('app-cart-badge')).toBeNull();
    expect(element.querySelector('.account-menu')).toBeNull();
  });

  it('replaces login with search, cart, and an account menu for an authenticated user', () => {
    authStore.isAuthenticated.set(true);
    cartStore.totalQuantity.set(3);
    authStore.user.set({
      id: 1,
      username: 'emilys',
      email: 'emily@example.test',
      firstName: 'Emily',
      lastName: 'Johnson',
      gender: 'female',
      image: 'https://example.test/emily.png',
    });
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const summary = element.querySelector('summary') as HTMLElement;

    expect(element.querySelector('a[href="/login"]')).toBeNull();
    expect(element.querySelector('input[type="search"]')).not.toBeNull();
    expect(element.querySelector('.cart-badge')?.getAttribute('aria-label')).toBe('Cart, 3 items');
    expect(element.querySelector('.cart-badge__count')?.textContent).toContain('3');
    expect(element.querySelector<HTMLImageElement>('.search-icon')?.src).toContain(
      '/assets/images/Search.png',
    );
    expect(element.querySelector<HTMLImageElement>('.cart-badge img')?.src).toContain(
      '/assets/images/Cart.png',
    );
    expect(summary.textContent).toContain('Account');
    expect(summary.getAttribute('aria-label')).toBe('Account for Emily Johnson');
  });

  it('debounces normalized search into the product URL and preserves category', async () => {
    authStore.isAuthenticated.set(true);
    await TestBed.inject(Router).navigateByUrl('/products?page=3&category=smartphones');
    fixture.detectChanges();

    const input = (fixture.nativeElement as HTMLElement).querySelector(
      'input[type="search"]',
    ) as HTMLInputElement;
    input.value = '  phone   case  ';
    input.dispatchEvent(new Event('input', { bubbles: true }));

    await new Promise((resolve) => setTimeout(resolve, 325));
    await fixture.whenStable();
    fixture.detectChanges();

    const url = TestBed.inject(Router).parseUrl(TestBed.inject(Router).url);
    expect(url.queryParams).toEqual({
      page: '1',
      category: 'smartphones',
      search: 'phone case',
    });
  });
});
