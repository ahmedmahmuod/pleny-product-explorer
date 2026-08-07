import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { Breadcrumb, BreadcrumbItem } from './breadcrumb';

describe('Breadcrumb', () => {
  let fixture: ComponentFixture<Breadcrumb>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Breadcrumb],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Breadcrumb);
  });

  it('renders navigable items and the current item with separators', () => {
    const items: readonly BreadcrumbItem[] = [
      { id: 'home', label: 'Home', route: '/products', queryParams: { page: 1 } },
      { id: 'products', label: 'Products', current: true },
    ];

    fixture.componentRef.setInput('items', items);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('a')).toHaveLength(1);
    expect(fixture.nativeElement.querySelector('a')?.textContent).toContain('Home');
    expect(fixture.nativeElement.querySelector('[aria-current="page"]')?.textContent).toContain(
      'Products',
    );
    expect(fixture.nativeElement.querySelector('.breadcrumb__separator')?.textContent).toBe('/');
  });

  it('uses the supplied accessible navigation label', () => {
    fixture.componentRef.setInput('items', [{ id: 'current', label: 'Products', current: true }]);
    fixture.componentRef.setInput('ariaLabel', 'Product path');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('nav')?.getAttribute('aria-label')).toBe(
      'Product path',
    );
  });
});
