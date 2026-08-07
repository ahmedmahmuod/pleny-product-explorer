import { PRODUCTS_PAGE_SIZE } from '../models/product-query.models';
import {
  DEFAULT_PRODUCT_QUERY,
  getProductPagination,
  normalizeProductQuery,
} from './product-query';

describe('product query utilities', () => {
  it('uses the default query when values are missing', () => {
    expect(normalizeProductQuery({})).toEqual(DEFAULT_PRODUCT_QUERY);
  });

  it.each([null, undefined, '', '0', '-1', '1.5', 'not-a-page', 0, -2, 2.5])(
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
    });
  });

  it('converts a one-based page into limit and skip', () => {
    expect(getProductPagination(3)).toEqual({
      limit: PRODUCTS_PAGE_SIZE,
      skip: PRODUCTS_PAGE_SIZE * 2,
    });
  });
});
