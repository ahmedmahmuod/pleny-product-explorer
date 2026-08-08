import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../../config/api.config';
import { AddCartRequest, Cart, CartsResponse } from '../models/cart.models';

@Injectable({ providedIn: 'root' })
export class CartApiService {
  private readonly http = inject(HttpClient);
  private readonly cartsUrl = `${inject(API_BASE_URL).replace(/\/+$/, '')}/carts`;

  getUserCarts(userId: number): Observable<CartsResponse> {
    return this.http.get<CartsResponse>(`${this.cartsUrl}/user/${userId}`);
  }

  addProduct(request: AddCartRequest): Observable<Cart> {
    return this.http.post<Cart>(`${this.cartsUrl}/add`, request);
  }
}
