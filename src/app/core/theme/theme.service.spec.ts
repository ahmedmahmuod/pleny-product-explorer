import { TestBed } from '@angular/core/testing';

import { THEME_STORAGE_KEY, ThemeService } from './theme.service';

describe('ThemeService', () => {
  let prefersDark = false;
  let changeSystemPreference: ((matches: boolean) => void) | undefined;

  beforeEach(() => {
    prefersDark = false;
    changeSystemPreference = undefined;
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');

    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: vi.fn((): MediaQueryList => {
        const mediaQuery = {
          get matches() {
            return prefersDark;
          },
          addEventListener: vi.fn(
            (_type: string, listener: EventListenerOrEventListenerObject): void => {
              changeSystemPreference = (matches: boolean): void => {
                const event = { matches } as MediaQueryListEvent;

                if (typeof listener === 'function') {
                  listener(event);
                } else {
                  listener.handleEvent(event);
                }
              };
            },
          ),
          removeEventListener: vi.fn(),
        } as unknown as MediaQueryList;

        return mediaQuery;
      }),
    });
  });

  afterEach(() => {
    document.documentElement.removeAttribute('data-theme');
    localStorage.clear();
  });

  it('uses the system preference when no user choice is stored', () => {
    prefersDark = true;
    const service = TestBed.inject(ThemeService);

    TestBed.tick();

    expect(service.theme()).toBe('dark');
    expect(service.isDark()).toBe(true);
    expect(document.documentElement.dataset['theme']).toBe('dark');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBeNull();
  });

  it('restores and applies a stored user choice', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'light');
    prefersDark = true;
    const service = TestBed.inject(ThemeService);

    TestBed.tick();

    expect(service.theme()).toBe('light');
    expect(document.documentElement.dataset['theme']).toBe('light');
  });

  it('persists a user-controlled dark mode change', () => {
    const service = TestBed.inject(ThemeService);

    service.setDarkMode(true);
    TestBed.tick();

    expect(service.isDark()).toBe(true);
    expect(document.documentElement.dataset['theme']).toBe('dark');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
  });

  it('continues following system changes until the user makes a choice', () => {
    const service = TestBed.inject(ThemeService);

    changeSystemPreference?.(true);
    TestBed.tick();

    expect(service.theme()).toBe('dark');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBeNull();
  });
});
