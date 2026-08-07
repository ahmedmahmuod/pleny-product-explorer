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

function normalizePage(value: ProductQueryInput['page']): number {
  const page = typeof value === 'number' ? value : Number(value);

  return Number.isSafeInteger(page) && page >= 1 ? page : 1;
}

function normalizeSearch(value: ProductQueryInput['search']): string {
  return typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : '';
}

function normalizeCategory(value: ProductQueryInput['category']): string {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}
