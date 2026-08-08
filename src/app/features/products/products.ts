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
import { Breadcrumb, BreadcrumbItem } from '../../shared/ui/breadcrumb/breadcrumb';
import { Pagination } from '../../shared/ui/pagination/pagination';
import { ProductCard } from '../../shared/ui/product-card/product-card';
import { CartStore } from '../../core/cart/data-access/cart.store';
import { CategoryFilter, CategoryFilterOption } from './components/category-filter/category-filter';
import { ProductsStore } from './data-access/products.store';
import {
  ProductQuery,
  ProductQueryInput,
  ProductSort,
  ProductSortBy,
  ProductSortOrder,
} from './models/product-query.models';
import {
  isCanonicalProductQueryInput,
  normalizeProductQuery,
  productQueriesEqual,
  toProductQueryParams,
} from './utils/product-query';

@Component({
  selector: 'app-products-page',
  imports: [Breadcrumb, CategoryFilter, ProductCard, Pagination],
  templateUrl: './products.html',
  styleUrl: './products.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductsPage {
  // Router query parameters are the source of truth for the product view.
  readonly page = input<string | undefined>();
  readonly search = input<string | undefined>();
  readonly category = input<string | undefined>();
  readonly sortBy = input<string | undefined>();
  readonly order = input<string | undefined>();

  // Global dependencies: the page coordinates stores and URL navigation.
  private readonly productsStore = inject(ProductsStore);
  protected readonly cartStore = inject(CartStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  // Normalized route state keeps invalid or differently formatted URLs out of
  // the store and gives the template one stable query model.
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

  // Store-backed view state is exposed directly to the template as signals.
  protected readonly categoryOptions = computed(() => this.createCategoryOptions());
  protected readonly products = this.productsStore.products;
  protected readonly total = this.productsStore.total;
  protected readonly totalPages = this.productsStore.totalPages;
  protected readonly isLoading = this.productsStore.isLoading;
  protected readonly status = this.productsStore.status;
  protected readonly productsError = this.productsStore.error;
  protected readonly heading = computed(() => this.createPageHeading(this.routeQuery()));
  protected readonly breadcrumbItems = computed(() =>
    this.createBreadcrumbItems(this.routeQuery()),
  );
  protected readonly resultSummary = computed(() =>
    this.createResultSummary(this.total(), this.isLoading()),
  );

  protected readonly sortOptions: readonly { readonly value: string; readonly label: string }[] = [
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

  // Calling rxMethod connects route signals to cancellable store workflows.
  private readonly productsConnection = this.productsStore.loadProducts(this.routeQuery);
  private readonly categoriesConnection = this.productsStore.loadCategories();

  // This computed signal produces the URL that should be used after query
  // normalization or after a requested page is proven to be out of range.
  private readonly canonicalQuery = computed(() => this.createCanonicalQuery(this.routeQuery()), {
    equal: productQueriesEqual,
  });

  // URL replacement is the only side effect here; derived values stay computed.
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

    this.navigateToQuery(
      { ...this.routeQuery(), page: 1, category: normalizedCategory },
      'Unable to update product filters. Please try again.',
      () => this.categoryDraft.set(this.routeQuery().category),
    );
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
    const sort = parseProductSort(value);

    if (!sort) {
      return;
    }

    this.navigateToQuery(
      { ...this.routeQuery(), page: 1, ...sort },
      'Unable to update product sorting. Please try again.',
    );
  }

  protected changePage(page: number): void {
    this.navigateToQuery(
      { ...this.routeQuery(), page },
      'Unable to update product page. Please try again.',
    );
  }

  private createCategoryOptions(): readonly CategoryFilterOption[] {
    return [
      { value: '', label: 'All' },
      ...this.productsStore
        .categories()
        .map(({ slug, name, count }) => ({ value: slug, label: name, count })),
    ];
  }

  private createPageHeading(query: ProductQuery): string {
    if (query.search) {
      return query.search;
    }

    return query.category ? this.categoryLabel(query.category) : 'Products';
  }

  private createBreadcrumbItems(query: ProductQuery): readonly BreadcrumbItem[] {
    const items: BreadcrumbItem[] = [
      { id: 'home', label: 'Home', route: '/', queryParams: { page: 1 } },
      {
        id: 'products',
        label: 'Products',
        route: '/products',
        queryParams: { page: 1 },
        current: !query.category && !query.search,
      },
    ];

    if (query.category) {
      items.push({
        id: 'category',
        label: this.categoryLabel(query.category),
        route: '/products',
        queryParams: { page: 1, category: query.category },
        current: !query.search,
      });
    }

    if (query.search) {
      items.push({ id: 'search', label: query.search, current: true });
    }

    return items;
  }

  private createResultSummary(total: number, isLoading: boolean): string {
    return isLoading ? 'Loading products' : `(${total}) Products Found`;
  }

  private createCanonicalQuery(routeQuery: ProductQuery): ProductQuery {
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
  }

  private navigateToQuery(query: ProductQuery, errorMessage: string, onFailure?: () => void): void {
    this.queryNavigationError.set(null);

    void this.router
      .navigate([], {
        relativeTo: this.route,
        queryParams: toProductQueryParams(query),
      })
      .catch(() => {
        onFailure?.();
        this.queryNavigationError.set(errorMessage);
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

function parseProductSort(value: string): ProductSort | null {
  const [sortBy, order] = value.split(':');

  return isProductSortBy(sortBy) && isProductSortOrder(order) ? { sortBy, order } : null;
}
