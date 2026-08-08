import { DOCUMENT } from '@angular/common';
import { computed, DestroyRef, effect, inject, Injectable, signal } from '@angular/core';

export type Theme = 'light' | 'dark';
type ThemePreference = Theme | 'system';

export const THEME_STORAGE_KEY = 'clicktik-theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);
  private readonly mediaQuery = this.getMediaQuery();
  private readonly systemTheme = signal(this.mediaQuery?.matches ? 'dark' : 'light');
  private readonly preference = signal(this.readPreference());

  readonly theme = computed(() => {
    const preference = this.preference();
    return preference === 'system' ? this.systemTheme() : preference;
  });
  readonly isDark = computed(() => this.theme() === 'dark');

  // Theme choice changes the browser document and storage, which are true external side effects.
  private readonly synchronizeTheme = effect(() => {
    const preference = this.preference();
    this.document.documentElement.dataset['theme'] = this.theme();
    this.writePreference(preference);
  });

  constructor() {
    this.listenToSystemThemeChanges();
  }

  setDarkMode(isDark: boolean): void {
    this.preference.set(isDark ? 'dark' : 'light');
  }

  private getMediaQuery(): MediaQueryList | undefined {
    const browserWindow = this.document.defaultView;
    return typeof browserWindow?.matchMedia === 'function'
      ? browserWindow.matchMedia('(prefers-color-scheme: dark)')
      : undefined;
  }

  private listenToSystemThemeChanges(): void {
    const mediaQuery = this.mediaQuery;
    if (!mediaQuery) {
      return;
    }

    const updateSystemTheme = ({ matches }: MediaQueryListEvent): void => {
      this.systemTheme.set(matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', updateSystemTheme);
    this.destroyRef.onDestroy(() => mediaQuery.removeEventListener('change', updateSystemTheme));
  }

  private readPreference(): ThemePreference {
    try {
      const storedPreference = this.document.defaultView?.localStorage.getItem(THEME_STORAGE_KEY);
      return storedPreference === 'light' || storedPreference === 'dark' ? storedPreference : 'system';
    } catch {
      return 'system';
    }
  }

  private writePreference(preference: ThemePreference): void {
    try {
      const storage = this.document.defaultView?.localStorage;

      if (preference === 'system') {
        storage?.removeItem(THEME_STORAGE_KEY);
      } else {
        storage?.setItem(THEME_STORAGE_KEY, preference);
      }
    } catch {
      // The in-memory theme remains usable when browser storage is unavailable.
    }
  }
}
