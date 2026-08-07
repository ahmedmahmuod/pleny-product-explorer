import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CartBadge } from './cart-badge';

describe('CartBadge', () => {
  let fixture: ComponentFixture<CartBadge>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [CartBadge] }).compileComponents();

    fixture = TestBed.createComponent(CartBadge);
    fixture.detectChanges();
  });

  it('renders the cart quantity with singular and plural accessible labels', () => {
    fixture.componentRef.setInput('count', 1);
    fixture.detectChanges();

    const badge = fixture.nativeElement.querySelector('.cart-badge') as HTMLElement;
    expect(badge.getAttribute('aria-label')).toBe('Cart, 1 item');
    expect(fixture.nativeElement.querySelector('.cart-badge__count')?.textContent).toContain('1');

    fixture.componentRef.setInput('count', 3);
    fixture.detectChanges();

    expect(badge.getAttribute('aria-label')).toBe('Cart, 3 items');
  });

  it('normalizes negative counts and exposes initialization busy state', () => {
    fixture.componentRef.setInput('count', -4);
    fixture.componentRef.setInput('loading', true);
    fixture.detectChanges();

    const badge = fixture.nativeElement.querySelector('.cart-badge') as HTMLElement;
    expect(badge.getAttribute('aria-label')).toBe('Cart, 0 items');
    expect(badge.getAttribute('aria-busy')).toBe('true');
    expect(fixture.nativeElement.querySelector('.cart-badge__count')?.textContent).toContain('0');
  });
});
