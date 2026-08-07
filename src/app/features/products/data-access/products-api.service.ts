import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

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
    return this.http.get<readonly ProductCategory[]>(`${this.productsUrl}/categories`);
  }

  private getPaginationParams({ limit, skip }: ProductPagination): HttpParams {
    return new HttpParams().set('limit', limit).set('skip', skip);
  }
}
