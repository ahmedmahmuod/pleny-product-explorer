import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  model,
} from '@angular/core';

export interface SelectOption {
  readonly value: string;
  readonly label: string;
  readonly disabled?: boolean;
}

let nextSelectId = 0;

@Component({
  selector: 'app-select',
  templateUrl: './select.html',
  styleUrl: './select.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Select {
  readonly label = input.required<string>();
  readonly options = input.required<readonly SelectOption[]>();
  readonly id = input<string | null>(null);
  readonly name = input<string | null>(null);
  readonly placeholder = input<string | null>(null);
  readonly hint = input<string | null>(null);
  readonly error = input<string | null>(null);
  readonly required = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly loading = input(false, { transform: booleanAttribute });
  readonly loadingLabel = input('Loading options');
  readonly value = model('');

  private readonly generatedId = `app-select-${nextSelectId++}`;

  protected readonly controlId = computed(() => this.id() ?? this.generatedId);
  protected readonly hintId = computed(() => `${this.controlId()}-hint`);
  protected readonly errorId = computed(() => `${this.controlId()}-error`);
  protected readonly interactionDisabled = computed(() => this.disabled() || this.loading());
  protected readonly describedBy = computed(() => {
    if (this.error()) {
      return this.errorId();
    }

    return this.hint() ? this.hintId() : null;
  });

  protected updateValue(event: Event): void {
    const selectElement = event.target;

    if (selectElement instanceof HTMLSelectElement) {
      this.value.set(selectElement.value);
    }
  }
}
