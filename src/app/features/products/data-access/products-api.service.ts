import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { API_BASE_URL } from '../../../core/config/api.config';
import { ProductSort } from '../models/product-query.models';
import { ProductCategory, ProductPagination, ProductsResponse } from '../models/product.models';

@Injectable({ providedIn: 'root' })
export class ProductsApiService {
  private readonly http = inject(HttpClient);
  private readonly productsUrl = `${inject(API_BASE_URL).replace(/\/+$/, '')}/products`;

  getProducts(pagination: ProductPagination, sort?: ProductSort): Observable<ProductsResponse> {
    return this.http.get<ProductsResponse>(this.productsUrl, {
      params: this.getPaginationParams(pagination, sort),
    });
  }

  searchProducts(search: string, pagination: ProductPagination, sort?: ProductSort): Observable<ProductsResponse> {
    return this.http.get<ProductsResponse>(`${this.productsUrl}/search`, {
      params: this.getPaginationParams(pagination, sort).set('q', search),
    });
  }

  getProductsByCategory(category: string, pagination: ProductPagination, sort?: ProductSort): Observable<ProductsResponse> {
    return this.http.get<ProductsResponse>(
      `${this.productsUrl}/category/${encodeURIComponent(category)}`,
      { params: this.getPaginationParams(pagination, sort) },
    );
  }

  getCategories(): Observable<readonly ProductCategory[]> {
    return this.http.get<readonly ProductCategory[]>(`${this.productsUrl}/categories`);
  }

  /**
   * Loads the optional category-count metadata separately from the category
   * list so the first product request is not blocked by count enrichment.
   */
  getCategoryCounts(): Observable<ReadonlyMap<string, number>> {
    return this.getProducts({ limit: 0, skip: 0 }).pipe(
      map(({ products }) => {
        const counts = new Map<string, number>();

        for (const product of products) {
          const category = product.category.toLowerCase();
          counts.set(category, (counts.get(category) ?? 0) + 1);
        }

        return counts;
      }),
    );
  }

  private getPaginationParams({ limit, skip }: ProductPagination, sort?: ProductSort): HttpParams {
    let params = new HttpParams().set('limit', limit).set('skip', skip);

    if (sort) {
      params = params.set('sortBy', sort.sortBy).set('order', sort.order);
    }

    return params;
  }
}
