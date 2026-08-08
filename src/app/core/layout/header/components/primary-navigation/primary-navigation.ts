import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-primary-navigation',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './primary-navigation.html',
  styleUrl: './primary-navigation.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PrimaryNavigation {
  protected readonly navigationLinks = [
    { label: 'Home', route: '/home', className: 'nav-link home-link' },
    { label: 'Products', route: '/products', className: 'nav-link products-link' },
  ] as const;
}
