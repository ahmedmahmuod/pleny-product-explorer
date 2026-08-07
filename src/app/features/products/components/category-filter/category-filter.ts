import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';

export interface CategoryFilterOption {
  readonly value: string;
  readonly label: string;
  readonly count?: number;
}

@Component({
  selector: 'app-category-filter',
  templateUrl: './category-filter.html',
  styleUrl: './category-filter.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoryFilter {
  readonly label = input('Products');
  readonly options = input.required<readonly CategoryFilterOption[]>();
  readonly value = input('');
  readonly loading = input(false, { transform: booleanAttribute });
  readonly error = input<string | null>(null);
  readonly valueChange = output<string>();
  readonly retry = output<void>();

  protected readonly fieldsetDisabled = computed(() => this.loading());
  protected readonly describedById = 'product-categories-error';

  protected selectCategory(value: string): void {
    if (this.fieldsetDisabled() || this.value() === value) {
      return;
    }

    this.valueChange.emit(value);
  }
}
