import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  input,
  model,
  viewChild,
} from '@angular/core';
import type { FormValueControl } from '@angular/forms/signals';

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
export class TextField implements FormValueControl<string> {
  readonly label = input.required<string>();
  readonly id = input<string | null>(null);
  readonly name = input('');
  readonly type = input<TextFieldType>('text');
  readonly autocomplete = input<TextFieldAutocomplete | null>(null);
  readonly placeholder = input<string | null>(null);
  readonly hint = input<string | null>(null);
  readonly error = input<string | null>(null);
  readonly required = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly value = model('');

  private readonly inputElement = viewChild.required<ElementRef<HTMLInputElement>>('inputElement');
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

  focus(options?: FocusOptions): void {
    this.inputElement().nativeElement.focus(options);
  }
}
