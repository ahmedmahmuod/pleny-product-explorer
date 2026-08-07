import { DecimalPipe } from '@angular/common';
import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';

import { Button } from '../button/button';

export interface ProductCardItem {
  readonly id: number;
  readonly title: string;
  readonly description: string;
  readonly category: string;
  readonly price: number;
  readonly discountPercentage: number;
  readonly rating: number;
  readonly stock: number;
  readonly brand?: string;
  readonly thumbnail: string;
  readonly reviews?: readonly unknown[];
}

@Component({
  selector: 'app-product-card',
  imports: [Button, DecimalPipe],
  templateUrl: './product-card.html',
  styleUrl: './product-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductCard {
  readonly product = input.required<ProductCardItem>();
  readonly adding = input(false, { transform: booleanAttribute });
  readonly inCart = input(false, { transform: booleanAttribute });
  readonly addDisabled = input(false, { transform: booleanAttribute });
  readonly addToCart = output<number>();

  protected readonly titleId = computed(() => `product-${this.product().id}-title`);
  protected readonly discountedPrice = computed(() => {
    const { discountPercentage, price } = this.product();

    return price * (1 - discountPercentage / 100);
  });
  protected readonly reviewCount = computed(() => this.product().reviews?.length ?? null);
  protected readonly actionDisabled = computed(
    () => this.addDisabled() || this.inCart() || this.product().stock <= 0,
  );
  protected readonly actionTooltip = computed(() =>
    this.inCart() ? `${this.product().title} is already in your cart` : null,
  );
  protected readonly actionDescriptionId = computed(() => `product-${this.product().id}-cart-help`);
  protected readonly ratingLabel = computed(() => {
    const { rating } = this.product();
    const count = this.reviewCount();

    if (count === null) {
      return `Rated ${rating} out of 5`;
    }

    return `Rated ${rating} out of 5 from ${count} ${count === 1 ? 'review' : 'reviews'}`;
  });
  protected readonly priceLabel = computed(() => {
    const { discountPercentage, price } = this.product();

    if (discountPercentage <= 0) {
      return `Price ${price} US dollars`;
    }

    return `Original price ${price} US dollars; discounted price ${this.discountedPrice().toFixed(2)} US dollars`;
  });

  protected requestAdd(): void {
    if (this.actionDisabled() || this.adding()) {
      return;
    }

    this.addToCart.emit(this.product().id);
  }
}
