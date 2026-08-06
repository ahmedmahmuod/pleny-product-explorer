import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TextField, TextFieldAutocomplete, TextFieldType } from './text-field';

@Component({
  imports: [TextField],
  template: `
    <app-text-field
      label="Account email"
      [id]="fieldId()"
      [name]="name()"
      [type]="type()"
      [autocomplete]="autocomplete()"
      [placeholder]="placeholder()"
      [hint]="hint()"
      [error]="error()"
      [required]="required()"
      [disabled]="disabled()"
      [(value)]="value"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class TextFieldTestHost {
  readonly fieldId = signal<string | null>('account-email');
  readonly name = signal<string | null>('email');
  readonly type = signal<TextFieldType>('email');
  readonly autocomplete = signal<TextFieldAutocomplete | null>('email');
  readonly placeholder = signal<string | null>('you@example.com');
  readonly hint = signal<string | null>('Use the email linked to your account.');
  readonly error = signal<string | null>(null);
  readonly required = signal(false);
  readonly disabled = signal(false);
  readonly value = signal('first@example.com');
}

describe('TextField', () => {
  let fixture: ComponentFixture<TextFieldTestHost>;
  let host: TextFieldTestHost;

  const inputElement = (): HTMLInputElement =>
    fixture.nativeElement.querySelector('input') as HTMLInputElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TextFieldTestHost],
    }).compileComponents();

    fixture = TestBed.createComponent(TextFieldTestHost);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('associates its label with the native input', () => {
    const label = fixture.nativeElement.querySelector('label') as HTMLLabelElement;

    expect(inputElement().id).toBe('account-email');
    expect(label.htmlFor).toBe('account-email');
    expect(label.textContent).toContain('Account email');
  });

  it('generates stable label and description IDs when no ID is supplied', () => {
    const generatedFixture = TestBed.createComponent(TextField);

    generatedFixture.componentRef.setInput('label', 'Username');
    generatedFixture.componentRef.setInput('hint', 'Use your account username.');
    generatedFixture.detectChanges();

    const input = generatedFixture.nativeElement.querySelector('input') as HTMLInputElement;
    const label = generatedFixture.nativeElement.querySelector('label') as HTMLLabelElement;
    const initialId = input.id;

    generatedFixture.detectChanges();

    expect(initialId).toMatch(/^app-text-field-\d+$/);
    expect(input.id).toBe(initialId);
    expect(label.htmlFor).toBe(initialId);
    expect(input.getAttribute('aria-describedby')).toBe(`${initialId}-hint`);
  });

  it('forwards native field configuration', () => {
    const input = inputElement();

    expect(input.name).toBe('email');
    expect(input.type).toBe('email');
    expect(input.autocomplete).toBe('email');
    expect(input.placeholder).toBe('you@example.com');

    host.type.set('password');
    host.autocomplete.set('current-password');
    fixture.detectChanges();

    expect(input.type).toBe('password');
    expect(input.autocomplete).toBe('current-password');
  });

  it('writes parent model changes to the native input', () => {
    host.value.set('updated@example.com');
    fixture.detectChanges();

    expect(inputElement().value).toBe('updated@example.com');
  });

  it('writes native input events back to the parent model', () => {
    const input = inputElement();

    input.value = 'typed@example.com';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(host.value()).toBe('typed@example.com');
  });

  it('uses the hint until an error takes precedence', () => {
    const input = inputElement();
    const hint = fixture.nativeElement.querySelector('.text-field__message') as HTMLElement;

    expect(hint.id).toBe('account-email-hint');
    expect(input.getAttribute('aria-describedby')).toBe('account-email-hint');
    expect(input.getAttribute('aria-invalid')).toBeNull();

    host.error.set('Enter a valid account email.');
    fixture.detectChanges();

    const error = fixture.nativeElement.querySelector('[role="alert"]') as HTMLElement;

    expect(error.id).toBe('account-email-error');
    expect(error.textContent).toContain('Enter a valid account email.');
    expect(input.getAttribute('aria-describedby')).toBe('account-email-error');
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(fixture.nativeElement.querySelector('#account-email-hint')).toBeNull();
  });

  it('forwards required and disabled semantics', () => {
    host.required.set(true);
    host.disabled.set(true);
    fixture.detectChanges();

    const requiredMarker = fixture.nativeElement.querySelector(
      '.text-field__required',
    ) as HTMLElement;

    expect(inputElement().required).toBe(true);
    expect(inputElement().disabled).toBe(true);
    expect(requiredMarker.getAttribute('aria-hidden')).toBe('true');
  });
});
