import { Routes } from '@angular/router';

import { authGuard } from './core/auth/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./core/layout/app-layout/app-layout').then(({ AppLayout }) => AppLayout),
    children: [
      {
        path: 'login',
        loadComponent: () =>
          import('./features/auth/pages/login/login').then(({ LoginPage }) => LoginPage),
      },
      {
        path: 'products',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./features/products/pages/products/products').then(
            ({ ProductsPage }) => ProductsPage,
          ),
      },
      { path: '', pathMatch: 'full', redirectTo: 'products' },
    ],
  },
];
