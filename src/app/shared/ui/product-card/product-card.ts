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
  // Component API: the page supplies product data and the current cart state.
  readonly product = input.required<ProductCardItem>();
  readonly priority = input(false, { transform: booleanAttribute });
  readonly adding = input(false, { transform: booleanAttribute });
  readonly inCart = input(false, { transform: booleanAttribute });
  readonly addDisabled = input(false, { transform: booleanAttribute });
  readonly addToCart = output<number>();

  // Derived values used by the template. They update automatically when inputs change.
  protected readonly titleId = computed(() => `product-${this.product().id}-title`);
  protected readonly discountedPrice = computed(() =>
    this.calculateDiscountedPrice(this.product()),
  );
  protected readonly reviewCount = computed(() => this.product().reviews?.length ?? null);
  protected readonly actionDisabled = computed(
    () => this.addDisabled() || this.inCart() || this.product().stock <= 0,
  );
  protected readonly actionTooltip = computed(() =>
    this.inCart() ? `${this.product().title} is already in your cart` : null,
  );
  protected readonly actionDescriptionId = computed(() => `product-${this.product().id}-cart-help`);
  protected readonly ratingLabel = computed(() =>
    this.createRatingLabel(this.product(), this.reviewCount()),
  );
  protected readonly priceLabel = computed(() =>
    this.createPriceLabel(this.product(), this.discountedPrice()),
  );

  // User interaction: emit intent only when the action is currently available.
  protected requestAdd(): void {
    if (this.actionDisabled() || this.adding()) {
      return;
    }

    this.addToCart.emit(this.product().id);
  }

  private calculateDiscountedPrice(product: ProductCardItem): number {
    const { discountPercentage, price } = product;

    return price * (1 - discountPercentage / 100);
  }

  private createRatingLabel(product: ProductCardItem, count: number | null): string {
    if (count === null) {
      return `Rated ${product.rating} out of 5`;
    }

    return `Rated ${product.rating} out of 5 from ${count} ${count === 1 ? 'review' : 'reviews'}`;
  }

  private createPriceLabel(product: ProductCardItem, discountedPrice: number): string {
    if (product.discountPercentage <= 0) {
      return `Price ${product.price} US dollars`;
    }

    return `Original price ${product.price} US dollars; discounted price ${discountedPrice.toFixed(2)} US dollars`;
  }
}
