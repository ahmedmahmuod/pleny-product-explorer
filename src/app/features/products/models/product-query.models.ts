export const PRODUCTS_PAGE_SIZE = 9;

export type ProductSortBy = 'title' | 'price' | 'rating';
export type ProductSortOrder = 'asc' | 'desc';

export interface ProductSort {
  readonly sortBy: ProductSortBy;
  readonly order: ProductSortOrder;
}

export interface ProductQueryInput {
  readonly page?: number | string | null;
  readonly search?: string | null;
  readonly category?: string | null;
  readonly sortBy?: string | null;
  readonly order?: string | null;
}

export interface ProductQuery extends ProductSort {
  readonly page: number;
  readonly search: string;
  readonly category: string;
}
