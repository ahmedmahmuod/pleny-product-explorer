import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  linkedSignal,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { Button } from '../../../../shared/ui/button/button';
import { Select, SelectOption } from '../../../../shared/ui/select/select';
import { ProductsStore } from '../../data-access/products.store';
import { ProductQuery, ProductQueryInput } from '../../models/product-query.models';
import {
  isCanonicalProductQueryInput,
  normalizeProductQuery,
  productQueriesEqual,
  toProductQueryParams,
} from '../../utils/product-query';

@Component({
  selector: 'app-products-page',
  imports: [Button, Select],
  templateUrl: './products.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductsPage {
  readonly page = input<string | undefined>();
  readonly search = input<string | undefined>();
  readonly category = input<string | undefined>();

  private readonly productsStore = inject(ProductsStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly routeQueryInput = computed<ProductQueryInput>(() => ({
    page: this.page(),
    search: this.search(),
    category: this.category(),
  }));
  private readonly routeQuery = computed(() => normalizeProductQuery(this.routeQueryInput()), {
    equal: productQueriesEqual,
  });
  protected readonly categoryDraft = linkedSignal(
    () => normalizeProductQuery({ category: this.category() }).category,
  );
  protected readonly queryNavigationError = signal<string | null>(null);
  protected readonly categoryOptions = computed<readonly SelectOption[]>(() =>
    this.productsStore.categories().map(({ slug, name }) => ({ value: slug, label: name })),
  );
  protected readonly areCategoriesLoading = this.productsStore.areCategoriesLoading;
  protected readonly categoriesError = this.productsStore.categoriesError;

  // rxMethod owns this signal subscription and tears it down with the route component.
  private readonly productsConnection = this.productsStore.loadProducts(this.routeQuery);
  private readonly categoriesConnection = this.productsStore.loadCategories();

  private readonly canonicalQuery = computed(
    (): ProductQuery => {
      const routeQuery = this.routeQuery();
      const query = this.isKnownCategory(routeQuery.category)
        ? routeQuery
        : { ...routeQuery, category: '' };

      if (
        this.productsStore.status() !== 'loaded' ||
        !productQueriesEqual(this.productsStore.query(), query)
      ) {
        return query;
      }

      const lastPage = Math.max(this.productsStore.totalPages(), 1);
      return query.page > lastPage ? { ...query, page: lastPage } : query;
    },
    { equal: productQueriesEqual },
  );

  // Replacing a non-canonical browser URL is an external navigation side effect.
  private readonly canonicalizeUrl = effect(() => {
    const inputQuery = this.routeQueryInput();
    const canonicalQuery = this.canonicalQuery();

    if (isCanonicalProductQueryInput(inputQuery, canonicalQuery)) {
      return;
    }

    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: toProductQueryParams(canonicalQuery),
      replaceUrl: true,
    });
  });

  protected changeCategory(category: string): void {
    const normalizedCategory = normalizeProductQuery({ category }).category;
    this.categoryDraft.set(normalizedCategory);
    this.queryNavigationError.set(null);

    void this.router
      .navigate([], {
        relativeTo: this.route,
        queryParams: toProductQueryParams({
          ...this.routeQuery(),
          page: 1,
          category: normalizedCategory,
        }),
      })
      .catch(() => {
        this.categoryDraft.set(this.routeQuery().category);
        this.queryNavigationError.set('Unable to update product filters. Please try again.');
      });
  }

  protected retryCategories(): void {
    this.productsStore.loadCategories();
  }

  private isKnownCategory(category: string): boolean {
    return (
      !category ||
      this.productsStore.categoriesStatus() !== 'loaded' ||
      this.productsStore.categories().some(({ slug }) => slug === category)
    );
  }
}
