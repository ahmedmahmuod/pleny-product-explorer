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
          import('./features/auth/pages/login/login').then(({ LoginPage }) => LoginPage),
      },
      { path: '', pathMatch: 'full', redirectTo: 'login' },
    ],
  },
];
