import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  linkedSignal,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  EMPTY,
  filter,
  from,
  map,
  switchMap,
} from 'rxjs';
import { normalizeSearchTerm } from '../../../../../shared/utilities/normalize-search-term';
import { AuthStore } from '../../../../auth/data-access/auth.store';

const SEARCH_DEBOUNCE_MS = 300;

@Component({
  selector: 'app-product-search',
  templateUrl: './product-search.html',
  styleUrl: './product-search.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductSearch {
  private readonly authStore = inject(AuthStore);
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

  // This subscription executes global product-search navigation and ends with the search field.
  private readonly searchNavigation = toObservable(this.searchDraft)
    .pipe(
      map(normalizeSearchTerm),
      debounceTime(SEARCH_DEBOUNCE_MS),
      distinctUntilChanged(),
      filter(() => this.authStore.isAuthenticated()),
      filter((search) => search !== this.routeSearch()),
      switchMap((search) => {
        this.searchNavigationError.set(null);
        return from(
          this.router.navigate(['/products'], {
            queryParams: { page: '1', search: search || null },
            queryParamsHandling: 'merge',
          }),
        ).pipe(
          catchError(() => {
            this.searchNavigationError.set('Unable to update product search. Please try again.');

            return EMPTY;
          }),
        );
      }),
      takeUntilDestroyed(),
    )
    .subscribe();

  protected updateSearch(value: string): void {
    this.searchDraft.set(value);
  }
}
