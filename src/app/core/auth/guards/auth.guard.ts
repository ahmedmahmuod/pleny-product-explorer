import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthStore } from '../stores/auth.store';
import { getSafeAuthReturnUrl } from '../utils/auth-return-url';

export const authGuard: CanActivateFn = (_route, state) => {
  const authStore = inject(AuthStore);

  if (authStore.isAuthenticated()) {
    return true;
  }

  return inject(Router).createUrlTree(['/login'], {
    queryParams: { returnUrl: getSafeAuthReturnUrl(state.url) },
  });
};
