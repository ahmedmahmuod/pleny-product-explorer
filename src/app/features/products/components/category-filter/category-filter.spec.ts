import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CategoryFilter } from './category-filter';

describe('CategoryFilter', () => {
  let fixture: ComponentFixture<CategoryFilter>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CategoryFilter],
    }).compileComponents();

    fixture = TestBed.createComponent(CategoryFilter);
    fixture.componentRef.setInput('options', [
      { value: '', label: 'All' },
      { value: 'smartphones', label: 'Smartphones', count: 12 },
    ]);
    fixture.detectChanges();
  });

  it('renders an accessible radio group with the selected category', () => {
    fixture.componentRef.setInput('value', 'smartphones');
    fixture.detectChanges();

    const fieldset = fixture.nativeElement.querySelector('fieldset') as HTMLFieldSetElement;
    const radios = categoryRadios();

    expect(fieldset.textContent).toContain('Products');
    expect(radios).toHaveLength(2);
    expect(radios[0]?.checked).toBe(false);
    expect(radios[1]?.checked).toBe(true);
    const labels = fixture.nativeElement.querySelectorAll('.category-filter__label');
    const counts = fixture.nativeElement.querySelectorAll('.category-filter__count');

    expect(labels[1]?.textContent?.trim()).toBe('Smartphones');
    expect(counts[0]?.textContent).toContain('(12)');
  });

  it('emits category changes from radio input', () => {
    const values: string[] = [];
    fixture.componentInstance.valueChange.subscribe((value) => values.push(value));

    categoryRadios()[1]?.dispatchEvent(new Event('change', { bubbles: true }));

    expect(values).toEqual(['smartphones']);
  });

  it('exposes loading and error states accessibly', () => {
    fixture.componentRef.setInput('loading', true);
    fixture.componentRef.setInput('error', 'Unable to load categories.');
    fixture.detectChanges();

    const fieldset = fixture.nativeElement.querySelector('fieldset') as HTMLFieldSetElement;

    expect(fieldset.disabled).toBe(true);
    expect(fieldset.getAttribute('aria-busy')).toBe('true');
    expect(fieldset.getAttribute('aria-describedby')).toBe('product-categories-error');
    expect(fixture.nativeElement.querySelector('[role="status"]')?.textContent).toContain(
      'Loading product categories',
    );
    expect(fixture.nativeElement.querySelectorAll('.category-filter__skeleton')).toHaveLength(16);
    expect(fixture.nativeElement.querySelectorAll('input[type="radio"]')).toHaveLength(0);
    expect(fixture.nativeElement.querySelector('[role="alert"]')?.textContent).toContain(
      'Unable to load categories.',
    );
  });

  it('emits retry intent from the inline retry action', () => {
    const retry = vi.fn();
    fixture.componentInstance.retry.subscribe(retry);
    fixture.componentRef.setInput('error', 'Unable to load categories.');
    fixture.detectChanges();

    retryButton().click();

    expect(retry).toHaveBeenCalledOnce();
  });

  function categoryRadios(): HTMLInputElement[] {
    return Array.from(fixture.nativeElement.querySelectorAll('input[type="radio"]'));
  }

  function retryButton(): HTMLButtonElement {
    return fixture.nativeElement.querySelector('button') as HTMLButtonElement;
  }
});
