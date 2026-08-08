import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  viewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { AuthStore } from '../../../../auth/data-access/auth.store';
import { ThemeService } from '../../../../theme/theme.service';

@Component({
  selector: 'app-account-menu',
  templateUrl: './account-menu.html',
  styleUrl: './account-menu.scss',
  host: {
    '(document:pointerdown)': 'closeOnOutsidePointer($event)',
    '(document:keydown.escape)': 'closeOnEscape($event)',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountMenu {
  private readonly authStore = inject(AuthStore);
  private readonly theme = inject(ThemeService);
  private readonly router = inject(Router);
  private readonly menu = viewChild.required<ElementRef<HTMLDetailsElement>>('menu');
  private readonly trigger = viewChild.required<ElementRef<HTMLElement>>('trigger');

  protected readonly isDark = this.theme.isDark;
  protected readonly accountLabel = computed(() => {
    const user = this.authStore.user();
    return user ? `Welcome ${user.firstName} ${user.lastName}` : 'Account';
  });
  protected readonly themeLabel = computed(() => (this.isDark() ? 'Dark mode' : 'Light mode'));

  protected setDarkMode(isDark: boolean): void {
    this.theme.setDarkMode(isDark);
  }

  protected closeOnOutsidePointer(event: Event): void {
    const menu = this.menu().nativeElement;
    const target = event.target;

    if (menu.open && target instanceof Node && !menu.contains(target)) {
      menu.open = false;
    }
  }

  protected closeOnEscape(event: Event): void {
    const menu = this.menu().nativeElement;

    if (!menu.open) {
      return;
    }

    event.preventDefault();
    menu.open = false;
    this.trigger().nativeElement.focus();
  }

  protected logout(): void {
    this.menu().nativeElement.open = false;
    this.authStore.logout();
    void this.router.navigate(['/login']);
  }
}
