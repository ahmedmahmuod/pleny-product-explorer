import { ChangeDetectionStrategy, Component, computed, effect, inject, input } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

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
  template: '<h1 class="visually-hidden">Products</h1>',
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

  // rxMethod owns this signal subscription and tears it down with the route component.
  private readonly productsConnection = this.productsStore.loadProducts(this.routeQuery);

  private readonly canonicalQuery = computed(
    (): ProductQuery => {
      const query = this.routeQuery();

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
}
