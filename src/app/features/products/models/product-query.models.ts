export const PRODUCTS_PAGE_SIZE = 9;

export interface ProductQueryInput {
  readonly page?: number | string | null;
  readonly search?: string | null;
  readonly category?: string | null;
}

export interface ProductQuery {
  readonly page: number;
  readonly search: string;
  readonly category: string;
}
