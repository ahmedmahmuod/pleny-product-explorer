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
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { ProductCard } from '../../../../shared/ui/product-card/product-card';
import { Pagination } from '../../../../shared/ui/pagination/pagination';
import { CartStore } from '../../../../core/cart/data-access/cart.store';
import {
  CategoryFilter,
  CategoryFilterOption,
} from '../../components/category-filter/category-filter';
import { ProductsStore } from '../../data-access/products.store';
import { ProductQuery, ProductQueryInput } from '../../models/product-query.models';
import { ProductSortBy, ProductSortOrder } from '../../models/product-query.models';
import {
  isCanonicalProductQueryInput,
  normalizeProductQuery,
  productQueriesEqual,
  toProductQueryParams,
} from '../../utils/product-query';

@Component({
  selector: 'app-products-page',
  imports: [CategoryFilter, ProductCard, Pagination, RouterLink],
  templateUrl: './products.html',
  styleUrl: './products.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductsPage {
  readonly page = input<string | undefined>();
  readonly search = input<string | undefined>();
  readonly category = input<string | undefined>();
  readonly sortBy = input<string | undefined>();
  readonly order = input<string | undefined>();

  private readonly productsStore = inject(ProductsStore);
  protected readonly cartStore = inject(CartStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly routeQueryInput = computed<ProductQueryInput>(() => ({
    page: this.page(),
    search: this.search(),
    category: this.category(),
    sortBy: this.sortBy(),
    order: this.order(),
  }));
  protected readonly routeQuery = computed(() => normalizeProductQuery(this.routeQueryInput()), {
    equal: productQueriesEqual,
  });
  protected readonly categoryDraft = linkedSignal(
    () => normalizeProductQuery({ category: this.category() }).category,
  );
  protected readonly queryNavigationError = signal<string | null>(null);
  protected readonly categoryOptions = computed<readonly CategoryFilterOption[]>(() => [
    { value: '', label: 'All' },
    ...this.productsStore
      .categories()
      .map(({ slug, name, count }) => ({ value: slug, label: name, count })),
  ]);
  protected readonly products = this.productsStore.products;
  protected readonly total = this.productsStore.total;
  protected readonly totalPages = this.productsStore.totalPages;
  protected readonly isLoading = this.productsStore.isLoading;
  protected readonly status = this.productsStore.status;
  protected readonly productsError = this.productsStore.error;
  protected readonly heading = computed(() => {
    const query = this.routeQuery();

    if (query.search) {
      return query.search;
    }

    if (query.category) {
      return this.categoryLabel(query.category);
    }

    return 'Products';
  });
  protected readonly breadcrumbCategory = computed(() => {
    const category = this.routeQuery().category;

    return category ? this.categoryLabel(category) : null;
  });
  protected readonly resultSummary = computed(() => {
    const total = this.total();

    if (this.status() === 'loading') {
      return 'Loading products';
    }

    return `(${total}) Products Found`;
  });
  protected readonly sortOptions: readonly {
    readonly value: string;
    readonly label: string;
  }[] = [
    { value: 'rating:desc', label: 'Popularity' },
    { value: 'title:asc', label: 'Name: A-Z' },
    { value: 'title:desc', label: 'Name: Z-A' },
    { value: 'price:asc', label: 'Price: Low to high' },
    { value: 'price:desc', label: 'Price: High to low' },
  ];
  protected readonly sortKey = computed(() => {
    const query = this.routeQuery();
    return `${query.sortBy}:${query.order}`;
  });
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

  protected retryProducts(): void {
    this.productsStore.retryProducts();
  }

  protected addToCart(productId: number): void {
    this.cartStore.addProduct(productId);
  }

  protected changeSort(value: string): void {
    const [sortBy, order] = value.split(':');

    if (!isProductSortBy(sortBy) || !isProductSortOrder(order)) {
      return;
    }

    this.queryNavigationError.set(null);

    void this.router
      .navigate([], {
        relativeTo: this.route,
        queryParams: {
          ...toProductQueryParams({
            ...this.routeQuery(),
            page: 1,
            sortBy,
            order,
          }),
        },
      })
      .catch(() => {
        this.queryNavigationError.set('Unable to update product sorting. Please try again.');
      });
  }

  protected changePage(page: number): void {
    this.queryNavigationError.set(null);

    void this.router
      .navigate([], {
        relativeTo: this.route,
        queryParams: toProductQueryParams({
          ...this.routeQuery(),
          page,
        }),
      })
      .catch(() => {
        this.queryNavigationError.set('Unable to update product page. Please try again.');
      });
  }

  private isKnownCategory(category: string): boolean {
    return (
      !category ||
      this.productsStore.categoriesStatus() !== 'loaded' ||
      this.productsStore.categories().some(({ slug }) => slug === category)
    );
  }

  private categoryLabel(category: string): string {
    const knownCategory = this.productsStore
      .categories()
      .find(({ slug }) => slug === category)?.name;

    return knownCategory ?? category.replaceAll('-', ' ');
  }
}

function isProductSortBy(value: string | undefined): value is ProductSortBy {
  return value === 'title' || value === 'price' || value === 'rating';
}

function isProductSortOrder(value: string | undefined): value is ProductSortOrder {
  return value === 'asc' || value === 'desc';
}
