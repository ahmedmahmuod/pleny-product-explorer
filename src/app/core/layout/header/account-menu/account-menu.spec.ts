import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { AuthStore } from '../../../auth/data-access/auth.store';
import { AuthUser } from '../../../auth/models/auth.models';
import { ThemeService } from '../../../theme/theme.service';
import { AccountMenu } from './account-menu';

@Component({
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class EmptyRoutePage {}

class AuthStoreStub {
  readonly user = signal<AuthUser | null>(null);
  readonly logout = vi.fn();
}

class ThemeServiceStub {
  readonly isDark = signal(false);
  readonly setDarkMode = vi.fn((isDark: boolean): void => this.isDark.set(isDark));
}

describe('AccountMenu', () => {
  let fixture: ComponentFixture<AccountMenu>;
  let authStore: AuthStoreStub;
  let theme: ThemeServiceStub;

  beforeEach(() => {
    authStore = new AuthStoreStub();
    theme = new ThemeServiceStub();

    TestBed.configureTestingModule({
      imports: [AccountMenu],
      providers: [
        provideRouter([{ path: 'login', component: EmptyRoutePage }]),
        { provide: AuthStore, useValue: authStore },
        { provide: ThemeService, useValue: theme },
      ],
    });

    fixture = TestBed.createComponent(AccountMenu);
    fixture.detectChanges();
  });

  it('opens from the account trigger and stays open for an inside pointer', () => {
    const menu = menuElement();

    triggerElement().click();
    expect(menu.open).toBe(true);

    switchElement().dispatchEvent(new Event('pointerdown', { bubbles: true }));
    expect(menu.open).toBe(true);
  });

  it('closes when a pointer interaction happens outside the menu', () => {
    const menu = menuElement();
    menu.open = true;

    document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }));

    expect(menu.open).toBe(false);
  });

  it('closes on Escape and restores focus to the account trigger', () => {
    const menu = menuElement();
    menu.open = true;

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

    expect(menu.open).toBe(false);
    expect(document.activeElement).toBe(triggerElement());
  });

  it('renders the active theme title and updates the visual switch', () => {
    expect(fixture.nativeElement.textContent).toContain('Light mode');
    expect(switchElement().checked).toBe(false);

    const toggle = switchElement();
    toggle.checked = true;
    toggle.dispatchEvent(new Event('change', { bubbles: true }));
    fixture.detectChanges();

    expect(theme.setDarkMode).toHaveBeenCalledWith(true);
    expect(fixture.nativeElement.textContent).toContain('Dark mode');
    expect(switchElement().checked).toBe(true);
  });

  it('clears the session, closes the menu, and navigates to login on logout', async () => {
    const menu = menuElement();
    menu.open = true;

    const logoutButton = (fixture.nativeElement as HTMLElement).querySelector(
      '.logout-button',
    ) as HTMLButtonElement;
    logoutButton.click();
    await fixture.whenStable();

    expect(authStore.logout).toHaveBeenCalledOnce();
    expect(menu.open).toBe(false);
    expect(TestBed.inject(Router).url).toBe('/login');
  });

  function menuElement(): HTMLDetailsElement {
    return (fixture.nativeElement as HTMLElement).querySelector('details') as HTMLDetailsElement;
  }

  function triggerElement(): HTMLElement {
    return (fixture.nativeElement as HTMLElement).querySelector('summary') as HTMLElement;
  }

  function switchElement(): HTMLInputElement {
    return (fixture.nativeElement as HTMLElement).querySelector(
      'input[role="switch"]',
    ) as HTMLInputElement;
  }
});
