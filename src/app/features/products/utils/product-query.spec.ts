import { PRODUCTS_PAGE_SIZE } from '../models/product-query.models';
import {
  DEFAULT_PRODUCT_QUERY,
  getProductPagination,
  isCanonicalProductQueryInput,
  normalizeProductQuery,
  productQueriesEqual,
  toProductQueryParams,
} from './product-query';

describe('product query utilities', () => {
  it('uses the default query when values are missing', () => {
    expect(normalizeProductQuery({})).toEqual(DEFAULT_PRODUCT_QUERY);
  });

  it.each([null, undefined, '', '0', '-1', '+2', '1.5', '1e2', '0x10', 'not-a-page', 0, -2, 2.5])(
    'normalizes invalid page %s to page one',
    (page) => {
      expect(normalizeProductQuery({ page }).page).toBe(1);
    },
  );

  it('accepts positive integer page strings and numbers', () => {
    expect(normalizeProductQuery({ page: '3' }).page).toBe(3);
    expect(normalizeProductQuery({ page: 4 }).page).toBe(4);
  });

  it('normalizes search whitespace and category casing', () => {
    expect(
      normalizeProductQuery({
        search: '  iPhone   12  ',
        category: '  SmartPhones  ',
      }),
    ).toEqual({
      page: 1,
      search: 'iPhone 12',
      category: 'smartphones',
      sortBy: 'rating',
      order: 'desc',
    });
  });

  it('normalizes and serializes supported sorting values', () => {
    expect(normalizeProductQuery({ sortBy: 'title', order: 'asc' })).toEqual({
      page: 1,
      search: '',
      category: '',
      sortBy: 'title',
      order: 'asc',
    });
    expect(
      toProductQueryParams(normalizeProductQuery({ sortBy: 'title', order: 'asc', page: 2 })),
    ).toEqual({ page: '2', sortBy: 'title', order: 'asc' });
  });

  it('converts a one-based page into limit and skip', () => {
    expect(getProductPagination(3)).toEqual({
      limit: PRODUCTS_PAGE_SIZE,
      skip: PRODUCTS_PAGE_SIZE * 2,
    });
  });

  it('serializes only canonical URL query parameters', () => {
    expect(
      toProductQueryParams({
        page: 2,
        search: 'phone case',
        category: 'smartphones',
        sortBy: 'rating',
        order: 'desc',
      }),
    ).toEqual({
      page: '2',
      search: 'phone case',
      category: 'smartphones',
    });
    expect(toProductQueryParams(DEFAULT_PRODUCT_QUERY)).toEqual({ page: '1' });
  });

  it('distinguishes canonical route input from values needing URL replacement', () => {
    const query = {
      page: 2,
      search: 'phone',
      category: 'smartphones',
      sortBy: 'rating' as const,
      order: 'desc' as const,
    };

    expect(isCanonicalProductQueryInput(query, query)).toBe(true);
    expect(
      isCanonicalProductQueryInput(
        { page: '02', search: ' phone ', category: 'SmartPhones' },
        query,
      ),
    ).toBe(false);
    expect(isCanonicalProductQueryInput({}, DEFAULT_PRODUCT_QUERY)).toBe(false);
  });

  it('compares normalized product queries by their values', () => {
    expect(productQueriesEqual(DEFAULT_PRODUCT_QUERY, { ...DEFAULT_PRODUCT_QUERY })).toBe(true);
    expect(productQueriesEqual(DEFAULT_PRODUCT_QUERY, { ...DEFAULT_PRODUCT_QUERY, page: 2 })).toBe(
      false,
    );
  });
});
