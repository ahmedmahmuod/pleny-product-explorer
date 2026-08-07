import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter, Router, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

import { routes } from '../../../../app.routes';
import { AuthCredentials, AuthUser } from '../../../../core/auth/models/auth.models';
import { AuthStore } from '../../../../core/auth/data-access/auth.store';
import { AppLayout } from '../../../../core/layout/app-layout/app-layout';
import { LoginPage } from './login';

class AuthStoreStub {
  readonly isAuthenticated = signal(false);
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);
  readonly user = signal<AuthUser | null>(null);
  readonly login = vi.fn((_credentials: AuthCredentials): void => undefined);
  readonly logout = vi.fn();
}

describe('LoginPage', () => {
  let authStore: AuthStoreStub;
  let harness: RouterTestingHarness;
  let page: LoginPage;

  const routeElement = (): HTMLElement => harness.routeNativeElement as HTMLElement;
  const activeLoginPage = (): LoginPage =>
    harness.fixture.debugElement.query(By.directive(LoginPage)).componentInstance as LoginPage;
  const usernameInput = (): HTMLInputElement =>
    routeElement().querySelector('input[autocomplete="username"]') as HTMLInputElement;
  const passwordInput = (): HTMLInputElement =>
    routeElement().querySelector('input[autocomplete="current-password"]') as HTMLInputElement;
  const formElement = (): HTMLFormElement =>
    routeElement().querySelector('form') as HTMLFormElement;

  beforeEach(async () => {
    authStore = new AuthStoreStub();

    TestBed.configureTestingModule({
      providers: [
        provideRouter(routes, withComponentInputBinding()),
        { provide: AuthStore, useValue: authStore },
      ],
    });

    harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/login', AppLayout);
    page = activeLoginPage();
  });

  it('loads lazily at the login route with semantic page landmarks', () => {
    const element = routeElement();

    expect(page).toBeInstanceOf(LoginPage);
    expect(element.querySelector('header')).not.toBeNull();
    expect(element.querySelector('nav[aria-label="Primary navigation"]')).not.toBeNull();
    expect(element.querySelector('main')).not.toBeNull();
    expect(element.querySelector('h1')?.textContent).toContain('Log in to your account');
    expect(element.querySelector('footer')).not.toBeNull();
    expect(element.querySelectorAll('img[src="assets/images/logo.png"]')).toHaveLength(3);
  });

  it('shows required errors, blocks submission, and focuses the first invalid field', () => {
    formElement().dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    harness.detectChanges();

    const errors = Array.from(routeElement().querySelectorAll('[role="alert"]')).map((element) =>
      element.textContent?.trim(),
    );

    expect(errors).toEqual(['Username is required.', 'Password is required.']);
    expect(authStore.login).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(usernameInput());
  });

  it('submits normalized credentials when the form is valid', () => {
    enterValue(usernameInput(), '  emilys  ');
    enterValue(passwordInput(), 'emilyspass');

    formElement().dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    harness.detectChanges();

    expect(authStore.login).toHaveBeenCalledOnce();
    expect(authStore.login).toHaveBeenCalledWith({
      username: 'emilys',
      password: 'emilyspass',
    });
  });

  it('disables fields and exposes button progress while login is active', async () => {
    authStore.isLoading.set(true);
    harness.detectChanges();
    await harness.fixture.whenStable();

    const button = routeElement().querySelector('button[type="submit"]') as HTMLButtonElement;

    expect(usernameInput().disabled).toBe(true);
    expect(passwordInput().disabled).toBe(true);
    expect(button.disabled).toBe(true);
    expect(button.getAttribute('aria-busy')).toBe('true');
    expect(routeElement().querySelector('[role="status"]')?.textContent).toContain('Signing in');
  });

  it('announces a server login error', () => {
    authStore.error.set('Invalid credentials');
    harness.detectChanges();

    const error = routeElement().querySelector('.server-error') as HTMLElement;

    expect(error.getAttribute('role')).toBe('alert');
    expect(error.getAttribute('aria-live')).toBe('assertive');
    expect(error.textContent).toContain('Invalid credentials');
  });

  it('redirects an authenticated user to the safe return URL', async () => {
    await harness.navigateByUrl('/login?returnUrl=%2Fproducts%3Fpage%3D2', AppLayout);
    page = activeLoginPage();
    const router = TestBed.inject(Router);
    const navigateByUrl = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);

    authStore.isAuthenticated.set(true);
    harness.detectChanges();
    await harness.fixture.whenStable();

    expect(page.returnUrl()).toBe('/products?page=2');
    expect(navigateByUrl).toHaveBeenCalledWith('/products?page=2');
  });
});

function enterValue(input: HTMLInputElement, value: string): void {
  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
}
