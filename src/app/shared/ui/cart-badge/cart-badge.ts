import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-cart-badge',
  templateUrl: './cart-badge.html',
  styleUrl: './cart-badge.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CartBadge {
  readonly count = input(0);
  readonly loading = input(false);
  readonly label = input<string | undefined>();

  protected readonly safeCount = computed(() => Math.max(0, this.count()));
  protected readonly accessibleLabel = computed(() => {
    const label = this.label();

    if (label) {
      return label;
    }

    const count = this.safeCount();
    return `Cart, ${count} ${count === 1 ? 'item' : 'items'}`;
  });
}
