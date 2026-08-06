import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  model,
} from '@angular/core';

export type TextFieldType = 'text' | 'email' | 'password' | 'search' | 'tel' | 'url';

export type TextFieldAutocomplete =
  | 'off'
  | 'on'
  | 'name'
  | 'email'
  | 'username'
  | 'current-password'
  | 'new-password'
  | 'one-time-code'
  | 'tel'
  | 'url';

let nextTextFieldId = 0;

@Component({
  selector: 'app-text-field',
  templateUrl: './text-field.html',
  styleUrl: './text-field.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TextField {
  readonly label = input.required<string>();
  readonly id = input<string | null>(null);
  readonly name = input<string | null>(null);
  readonly type = input<TextFieldType>('text');
  readonly autocomplete = input<TextFieldAutocomplete | null>(null);
  readonly placeholder = input<string | null>(null);
  readonly hint = input<string | null>(null);
  readonly error = input<string | null>(null);
  readonly required = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly value = model('');

  private readonly generatedId = `app-text-field-${nextTextFieldId++}`;

  protected readonly controlId = computed(() => this.id() ?? this.generatedId);
  protected readonly hintId = computed(() => `${this.controlId()}-hint`);
  protected readonly errorId = computed(() => `${this.controlId()}-error`);
  protected readonly describedBy = computed(() => {
    if (this.error()) {
      return this.errorId();
    }

    return this.hint() ? this.hintId() : null;
  });

  protected updateValue(event: Event): void {
    const inputElement = event.target;

    if (inputElement instanceof HTMLInputElement) {
      this.value.set(inputElement.value);
    }
  }
}
