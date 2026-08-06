import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Select, SelectOption } from './select';

@Component({
  imports: [Select],
  template: `
    <app-select
      label="Product category"
      [options]="options()"
      [id]="fieldId()"
      [name]="name()"
      [placeholder]="placeholder()"
      [hint]="hint()"
      [error]="error()"
      [required]="required()"
      [disabled]="disabled()"
      [loading]="loading()"
      [loadingLabel]="loadingLabel()"
      [(value)]="value"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class SelectTestHost {
  readonly options = signal<readonly SelectOption[]>([
    { value: 'smartphones', label: 'Smartphones' },
    { value: 'laptops', label: 'Laptops' },
    { value: 'archived', label: 'Archived', disabled: true },
  ]);
  readonly fieldId = signal<string | null>('product-category');
  readonly name = signal<string | null>('category');
  readonly placeholder = signal<string | null>('Choose a category');
  readonly hint = signal<string | null>('Filter the visible products.');
  readonly error = signal<string | null>(null);
  readonly required = signal(false);
  readonly disabled = signal(false);
  readonly loading = signal(false);
  readonly loadingLabel = signal('Loading product categories');
  readonly value = signal('smartphones');
}

describe('Select', () => {
  let fixture: ComponentFixture<SelectTestHost>;
  let host: SelectTestHost;

  const selectElement = (): HTMLSelectElement =>
    fixture.nativeElement.querySelector('select') as HTMLSelectElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SelectTestHost],
    }).compileComponents();

    fixture = TestBed.createComponent(SelectTestHost);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('associates its label with the native select', () => {
    const label = fixture.nativeElement.querySelector('label') as HTMLLabelElement;

    expect(selectElement().id).toBe('product-category');
    expect(label.htmlFor).toBe('product-category');
    expect(label.textContent).toContain('Product category');
  });

  it('generates stable label and description IDs when no ID is supplied', () => {
    const generatedFixture = TestBed.createComponent(Select);

    generatedFixture.componentRef.setInput('label', 'Category');
    generatedFixture.componentRef.setInput('options', []);
    generatedFixture.componentRef.setInput('hint', 'Choose one category.');
    generatedFixture.detectChanges();

    const select = generatedFixture.nativeElement.querySelector('select') as HTMLSelectElement;
    const label = generatedFixture.nativeElement.querySelector('label') as HTMLLabelElement;
    const initialId = select.id;

    generatedFixture.detectChanges();

    expect(initialId).toMatch(/^app-select-\d+$/);
    expect(select.id).toBe(initialId);
    expect(label.htmlFor).toBe(initialId);
    expect(select.getAttribute('aria-describedby')).toBe(`${initialId}-hint`);
  });

  it('renders the placeholder and typed options', () => {
    const options = Array.from(selectElement().options);

    expect(options.map((option) => option.value)).toEqual([
      '',
      'smartphones',
      'laptops',
      'archived',
    ]);
    expect(options.map((option) => option.text)).toEqual([
      'Choose a category',
      'Smartphones',
      'Laptops',
      'Archived',
    ]);
    expect(options[3]?.disabled).toBe(true);
    expect(selectElement().name).toBe('category');
  });

  it('writes parent model changes to the native select', () => {
    host.value.set('laptops');
    fixture.detectChanges();

    expect(selectElement().value).toBe('laptops');
  });

  it('writes native change events back to the parent model', () => {
    const select = selectElement();

    select.value = 'laptops';
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(host.value()).toBe('laptops');
  });

  it('uses the hint until an error takes precedence', () => {
    const select = selectElement();
    const hint = fixture.nativeElement.querySelector('.select-field__message') as HTMLElement;

    expect(hint.id).toBe('product-category-hint');
    expect(select.getAttribute('aria-describedby')).toBe('product-category-hint');
    expect(select.getAttribute('aria-invalid')).toBeNull();

    host.error.set('Choose an available category.');
    fixture.detectChanges();

    const error = fixture.nativeElement.querySelector('[role="alert"]') as HTMLElement;

    expect(error.id).toBe('product-category-error');
    expect(error.textContent).toContain('Choose an available category.');
    expect(select.getAttribute('aria-describedby')).toBe('product-category-error');
    expect(select.getAttribute('aria-invalid')).toBe('true');
    expect(fixture.nativeElement.querySelector('#product-category-hint')).toBeNull();
  });

  it('forwards required and disabled semantics to the native select', () => {
    host.required.set(true);
    host.disabled.set(true);
    fixture.detectChanges();

    const placeholder = selectElement().options[0];
    const requiredMarker = fixture.nativeElement.querySelector(
      '.select-field__required',
    ) as HTMLElement;

    expect(selectElement().required).toBe(true);
    expect(selectElement().disabled).toBe(true);
    expect(placeholder?.disabled).toBe(true);
    expect(requiredMarker.getAttribute('aria-hidden')).toBe('true');
  });

  it('disables and announces loading without creating a loading option', () => {
    host.loading.set(true);
    fixture.detectChanges();

    const select = selectElement();
    const status = fixture.nativeElement.querySelector('[role="status"]') as HTMLElement;

    expect(select.disabled).toBe(true);
    expect(select.getAttribute('aria-busy')).toBe('true');
    expect(status.textContent).toContain('Loading product categories');
    expect(Array.from(select.options).some((option) => option.text.includes('Loading'))).toBe(
      false,
    );

    host.loading.set(false);
    fixture.detectChanges();

    expect(select.disabled).toBe(false);
    expect(select.getAttribute('aria-busy')).toBeNull();
    expect(fixture.nativeElement.querySelector('[role="status"]')).toBeNull();
  });
});
