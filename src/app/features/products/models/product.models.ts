export interface Product {
  readonly id: number;
  readonly title: string;
  readonly description: string;
  readonly category: string;
  readonly price: number;
  readonly discountPercentage: number;
  readonly rating: number;
  readonly stock: number;
  readonly tags: readonly string[];
  readonly brand?: string;
  readonly thumbnail: string;
  readonly images: readonly string[];
}

export interface ProductCategory {
  readonly slug: string;
  readonly name: string;
  readonly url: string;
}

export interface ProductsResponse {
  readonly products: readonly Product[];
  readonly total: number;
  readonly skip: number;
  readonly limit: number;
}

export interface ProductPagination {
  readonly limit: number;
  readonly skip: number;
}
