import {
  PRODUCTS_PAGE_SIZE,
  ProductQuery,
  ProductQueryInput,
  ProductSortBy,
  ProductSortOrder,
} from '../models/product-query.models';
import { ProductPagination } from '../models/product.models';
import { normalizeSearchTerm } from '../../../shared/utilities/normalize-search-term';

export const DEFAULT_PRODUCT_QUERY: ProductQuery = {
  page: 1,
  search: '',
  category: '',
  sortBy: 'rating',
  order: 'desc',
};

export function normalizeProductQuery(input: ProductQueryInput): ProductQuery {
  return {
    page: normalizePage(input.page),
    search: normalizeSearchTerm(input.search),
    category: normalizeCategory(input.category),
    sortBy: normalizeSortBy(input.sortBy),
    order: normalizeSortOrder(input.order),
  };
}

export function getProductPagination(page: number): ProductPagination {
  return {
    limit: PRODUCTS_PAGE_SIZE,
    skip: (page - 1) * PRODUCTS_PAGE_SIZE,
  };
}

export function toProductQueryParams(query: ProductQuery): Readonly<Record<string, string>> {
  const params: Record<string, string> = { page: String(query.page) };

  if (query.search) {
    params['search'] = query.search;
  }

  if (query.category) {
    params['category'] = query.category;
  }

  if (
    query.sortBy !== DEFAULT_PRODUCT_QUERY.sortBy ||
    query.order !== DEFAULT_PRODUCT_QUERY.order
  ) {
    params['sortBy'] = query.sortBy;
    params['order'] = query.order;
  }

  return params;
}

export function isCanonicalProductQueryInput(
  input: ProductQueryInput,
  query: ProductQuery,
): boolean {
  const params = toProductQueryParams(query);

  return (
    toOptionalString(input.page) === params['page'] &&
    (input.search ?? undefined) === params['search'] &&
    (input.category ?? undefined) === params['category']
  );
}

export function productQueriesEqual(left: ProductQuery, right: ProductQuery): boolean {
  return (
    left.page === right.page &&
    left.search === right.search &&
    left.category === right.category &&
    left.sortBy === right.sortBy &&
    left.order === right.order
  );
}

function normalizePage(value: ProductQueryInput['page']): number {
  const page =
    typeof value === 'number'
      ? value
      : typeof value === 'string' && /^\d+$/.test(value)
        ? Number(value)
        : Number.NaN;

  return Number.isSafeInteger(page) && page >= 1 ? page : 1;
}

function normalizeCategory(value: ProductQueryInput['category']): string {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

function normalizeSortBy(value: ProductQueryInput['sortBy']): ProductSortBy {
  return value === 'title' || value === 'price' || value === 'rating'
    ? value
    : DEFAULT_PRODUCT_QUERY.sortBy;
}

function normalizeSortOrder(value: ProductQueryInput['order']): ProductSortOrder {
  return value === 'asc' || value === 'desc' ? value : DEFAULT_PRODUCT_QUERY.order;
}

function toOptionalString(value: number | string | null | undefined): string | undefined {
  return value === null || value === undefined ? undefined : String(value);
}
