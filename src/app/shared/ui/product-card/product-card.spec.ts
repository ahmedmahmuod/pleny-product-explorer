import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductCard, ProductCardItem } from './product-card';

describe('ProductCard', () => {
  const product: ProductCardItem = {
    id: 12,
    title: 'iPhone 12',
    description: 'An Apple mobile which is nothing like apple.',
    category: 'smartphones',
    price: 549,
    discountPercentage: 12.96,
    rating: 4.69,
    stock: 94,
    brand: 'Apple',
    thumbnail: 'https://example.com/iphone-12.png',
    reviews: [{}],
  };

  let fixture: ComponentFixture<ProductCard>;

  const nativeButton = (): HTMLButtonElement =>
    fixture.nativeElement.querySelector('button') as HTMLButtonElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductCard],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductCard);
    fixture.componentRef.setInput('product', product);
    fixture.detectChanges();
  });

  it('renders the product content, discounted price, metadata, and rating', () => {
    const card = fixture.nativeElement.querySelector('article') as HTMLElement;

    expect(card.getAttribute('aria-labelledby')).toBe('product-12-title');
    expect(card.textContent).toContain('iPhone 12');
    expect(card.textContent).toContain('An Apple mobile which is nothing like apple.');
    expect(card.textContent).toContain('- 12.96%');
    expect(card.textContent).toContain('$549 USD');
    expect(card.textContent).toContain('$477.85 USD');
    expect(card.textContent).toContain('Brand:');
    expect(card.textContent).toContain('Apple');
    expect(card.textContent).toContain('smartphones');
    expect(card.textContent).toContain('94');
    expect(card.textContent).toContain('4.69');
    expect(card.textContent).toContain('(1)');
  });

  it('provides a useful image description and intrinsic dimensions', () => {
    const image = fixture.nativeElement.querySelector('img') as HTMLImageElement;

    expect(image.src).toBe('https://example.com/iphone-12.png');
    expect(image.alt).toBe('iPhone 12 product image');
    expect(image.width).toBe(282);
    expect(image.height).toBe(257);
    expect(image.getAttribute('loading')).toBe('lazy');
    expect(image.getAttribute('fetchpriority')).toBe('auto');
  });

  it('exposes meaningful price and rating descriptions without prohibited ARIA', () => {
    const pricing = fixture.nativeElement.querySelector('.product-card__pricing') as HTMLElement;
    const rating = fixture.nativeElement.querySelector('.product-card__rating') as HTMLElement;

    expect(pricing.getAttribute('aria-label')).toBeNull();
    expect(pricing.querySelector('.visually-hidden')?.textContent).toContain(
      'Original price 549 US dollars; discounted price 477.85 US dollars',
    );
    expect(rating.getAttribute('aria-label')).toBeNull();
    expect(rating.querySelector('.visually-hidden')?.textContent).toContain(
      'Rated 4.69 out of 5 from 1 review',
    );
  });

  it('prioritizes only a card explicitly marked as the LCP candidate', () => {
    fixture.componentRef.setInput('priority', true);
    fixture.detectChanges();

    const image = fixture.nativeElement.querySelector('img') as HTMLImageElement;

    expect(image.getAttribute('loading')).toBe('eager');
    expect(image.getAttribute('fetchpriority')).toBe('high');
  });

  it('emits the product ID as add-to-cart intent', () => {
    const emittedIds: number[] = [];
    fixture.componentInstance.addToCart.subscribe((productId) => emittedIds.push(productId));

    nativeButton().click();

    expect(emittedIds).toEqual([12]);
  });

  it('disables and announces only the card action while adding', () => {
    fixture.componentRef.setInput('adding', true);
    fixture.detectChanges();

    const status = fixture.nativeElement.querySelector('[role="status"]') as HTMLElement;

    expect(nativeButton().disabled).toBe(true);
    expect(nativeButton().getAttribute('aria-busy')).toBe('true');
    expect(status.textContent).toContain('Adding iPhone 12 to cart');
  });

  it('does not emit when adding is explicitly disabled', () => {
    const emittedIds: number[] = [];
    fixture.componentInstance.addToCart.subscribe((productId) => emittedIds.push(productId));
    fixture.componentRef.setInput('addDisabled', true);
    fixture.detectChanges();

    nativeButton().click();

    expect(nativeButton().disabled).toBe(true);
    expect(emittedIds).toEqual([]);
  });

  it('disables an existing cart item and explains why it cannot be added again', () => {
    fixture.componentRef.setInput('inCart', true);
    fixture.detectChanges();

    expect(nativeButton().disabled).toBe(true);
    expect(nativeButton().textContent).toContain('Added to cart');
    expect(nativeButton().title).toBe('iPhone 12 is already in your cart');
    expect(nativeButton().getAttribute('aria-describedby')).toBe('product-12-cart-help');
    expect(fixture.nativeElement.textContent).toContain('This product is already in your cart.');
  });

  it('uses an unavailable action and blocks intent for an out-of-stock product', () => {
    const emittedIds: number[] = [];
    fixture.componentInstance.addToCart.subscribe((productId) => emittedIds.push(productId));
    fixture.componentRef.setInput('product', { ...product, stock: 0 });
    fixture.detectChanges();

    nativeButton().click();

    expect(nativeButton().disabled).toBe(true);
    expect(nativeButton().textContent).toContain('Out of stock');
    expect(emittedIds).toEqual([]);
  });
});
