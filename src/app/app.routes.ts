import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./core/layout/app-layout/app-layout').then(({ AppLayout }) => AppLayout),
    children: [
      {
        path: 'login',
        loadComponent: () =>
          import('./features/auth/login/login').then(({ LoginPage }) => LoginPage),
      },
      { path: '', pathMatch: 'full', redirectTo: 'login' },
    ],
  },
];
