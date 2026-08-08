import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Breadcrumb, BreadcrumbItem } from '../../shared/ui/breadcrumb/breadcrumb';

@Component({
  selector: 'app-home-page',
  imports: [Breadcrumb, RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePage {
  protected readonly breadcrumbItems: readonly BreadcrumbItem[] = [
    { id: 'home', label: 'Home', current: true },
    { id: 'products', label: 'Products', route: '/products' },
  ];
}
