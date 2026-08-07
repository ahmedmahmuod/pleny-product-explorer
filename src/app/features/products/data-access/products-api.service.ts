import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable, of, switchMap } from 'rxjs';

import { API_BASE_URL } from '../../../core/config/api.config';
import { ProductCategory, ProductPagination, ProductsResponse } from '../models/product.models';

@Injectable({ providedIn: 'root' })
export class ProductsApiService {
  private readonly http = inject(HttpClient);
  private readonly productsUrl = `${inject(API_BASE_URL).replace(/\/+$/, '')}/products`;

  getProducts(pagination: ProductPagination): Observable<ProductsResponse> {
    return this.http.get<ProductsResponse>(this.productsUrl, {
      params: this.getPaginationParams(pagination),
    });
  }

  searchProducts(search: string, pagination: ProductPagination): Observable<ProductsResponse> {
    return this.http.get<ProductsResponse>(`${this.productsUrl}/search`, {
      params: this.getPaginationParams(pagination).set('q', search),
    });
  }

  getProductsByCategory(
    category: string,
    pagination: ProductPagination,
  ): Observable<ProductsResponse> {
    return this.http.get<ProductsResponse>(
      `${this.productsUrl}/category/${encodeURIComponent(category)}`,
      { params: this.getPaginationParams(pagination) },
    );
  }

  getCategories(): Observable<readonly ProductCategory[]> {
    return this.http.get<readonly ProductCategory[]>(`${this.productsUrl}/categories`).pipe(
      switchMap((categories) => {
        if (categories.length === 0) {
          return of(categories);
        }

        // DummyJSON exposes category metadata without totals. One complete
        // collection request keeps the count enrichment bounded to one
        // additional request instead of making one request per category.
        return this.getProducts({ limit: 0, skip: 0 }).pipe(
          map(({ products }) => {
            const counts = new Map<string, number>();

            for (const product of products) {
              const category = product.category.toLowerCase();
              counts.set(category, (counts.get(category) ?? 0) + 1);
            }

            return categories.map((category) => ({
              ...category,
              count: counts.get(category.slug.toLowerCase()) ?? 0,
            }));
          }),
          // Counts are supplementary metadata. Keep the categories usable
          // when the optional enrichment request is unavailable.
          catchError(() => of(categories)),
        );
      }),
    );
  }

  private getPaginationParams({ limit, skip }: ProductPagination): HttpParams {
    return new HttpParams().set('limit', limit).set('skip', skip);
  }
}
