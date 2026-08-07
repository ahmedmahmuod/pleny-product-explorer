import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  linkedSignal,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink, RouterLinkActive } from '@angular/router';
import {
  catchError,
  debounceTime,
  defer,
  distinctUntilChanged,
  EMPTY,
  filter,
  from,
  map,
  switchMap,
} from 'rxjs';

import { normalizeSearchTerm } from '../../../shared/utilities/normalize-search-term';
import { AuthStore } from '../../auth/data-access/auth.store';
import { AccountMenu } from './account-menu/account-menu';

const SEARCH_DEBOUNCE_MS = 300;

@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive, AccountMenu],
  templateUrl: './header.html',
  styleUrl: './header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppHeader {
  protected readonly authStore = inject(AuthStore);

  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly queryParamMap = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });
  private readonly routeSearch = computed(() =>
    normalizeSearchTerm(this.queryParamMap().get('search')),
  );

  protected readonly searchDraft = linkedSignal(() => this.routeSearch());
  protected readonly searchNavigationError = signal<string | null>(null);

  // This subscription executes global product-search navigation and ends with the header.
  private readonly searchNavigation = toObservable(this.searchDraft)
    .pipe(
      map(normalizeSearchTerm),
      debounceTime(SEARCH_DEBOUNCE_MS),
      distinctUntilChanged(),
      filter(() => this.authStore.isAuthenticated()),
      filter((search) => search !== this.routeSearch()),
      switchMap((search) =>
        defer(() => {
          this.searchNavigationError.set(null);

          return from(
            this.router.navigate(['/products'], {
              queryParams: { page: '1', search: search || null },
              queryParamsHandling: 'merge',
            }),
          );
        }).pipe(
          // Recovery stays inside switchMap so a rejected navigation does not disable search.
          catchError(() => {
            this.searchNavigationError.set('Unable to update product search. Please try again.');
            return EMPTY;
          }),
        ),
      ),
      takeUntilDestroyed(),
    )
    .subscribe();

  protected updateSearch(value: string): void {
    this.searchDraft.set(value);
  }
}
