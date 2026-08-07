import {
  PRODUCTS_PAGE_SIZE,
  ProductQuery,
  ProductQueryInput,
} from '../models/product-query.models';
import { ProductPagination } from '../models/product.models';

export const DEFAULT_PRODUCT_QUERY: ProductQuery = {
  page: 1,
  search: '',
  category: '',
};

export function normalizeProductQuery(input: ProductQueryInput): ProductQuery {
  return {
    page: normalizePage(input.page),
    search: normalizeSearch(input.search),
    category: normalizeCategory(input.category),
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
    left.page === right.page && left.search === right.search && left.category === right.category
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

function normalizeSearch(value: ProductQueryInput['search']): string {
  return typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : '';
}

function normalizeCategory(value: ProductQueryInput['category']): string {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

function toOptionalString(value: number | string | null | undefined): string | undefined {
  return value === null || value === undefined ? undefined : String(value);
}
