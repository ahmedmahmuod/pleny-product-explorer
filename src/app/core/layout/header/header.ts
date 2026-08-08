import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CartBadge } from '../../../shared/ui/cart-badge/cart-badge';
import { AuthStore } from '../../auth/data-access/auth.store';
import { CartStore } from '../../cart/data-access/cart.store';
import { AccountMenu } from './components/account-menu/account-menu';
import { PrimaryNavigation } from './components/primary-navigation/primary-navigation';
import { ProductSearch } from './components/product-search/product-search';

@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive, AccountMenu, CartBadge, PrimaryNavigation, ProductSearch],
  templateUrl: './header.html',
  styleUrl: './header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppHeader {
  protected readonly authStore = inject(AuthStore);
  protected readonly cartStore = inject(CartStore);
}
