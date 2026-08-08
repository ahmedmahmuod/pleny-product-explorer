import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Pagination } from './pagination';

describe('Pagination', () => {
  let fixture: ComponentFixture<Pagination>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Pagination],
    }).compileComponents();

    fixture = TestBed.createComponent(Pagination);
    fixture.componentRef.setInput('currentPage', 2);
    fixture.componentRef.setInput('totalPages', 7);
    fixture.detectChanges();
  });

  it('renders page buttons with the current page semantics', () => {
    expect(pageButtons().map((button) => button.textContent?.trim())).toEqual([
      '1',
      '2',
      '3',
      '4',
      '5',
      '6',
      '7',
    ]);
    expect(currentPageButton().getAttribute('aria-current')).toBe('page');
    expect(currentPageButton().disabled).toBe(true);
  });

  it('emits previous, next, and explicit page changes', () => {
    const pages: number[] = [];
    fixture.componentInstance.pageChange.subscribe((page) => pages.push(page));

    controlButton('Previous page').click();
    pageButtons()[4]?.click();
    controlButton('Next page').click();

    expect(pages).toEqual([1, 5, 3]);
  });

  it('disables edge navigation while keeping a single loaded page visible', () => {
    fixture.componentRef.setInput('currentPage', 1);
    fixture.componentRef.setInput('totalPages', 1);
    fixture.detectChanges();

    expect(controlButton('Previous page').disabled).toBe(true);
    expect(controlButton('Next page').disabled).toBe(true);
    expect(pageButtons().map((button) => button.textContent?.trim())).toEqual(['1']);
  });

  it('uses a compact page window for larger page ranges', () => {
    fixture.componentRef.setInput('currentPage', 6);
    fixture.componentRef.setInput('totalPages', 12);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent.replaceAll(/\s+/g, ' ').trim()).toContain(
      '1 ... 5 6 7 ... 12',
    );
  });

  function pageButtons(): HTMLButtonElement[] {
    return Array.from(
      fixture.nativeElement.querySelectorAll('.pagination__page'),
    ) as HTMLButtonElement[];
  }

  function currentPageButton(): HTMLButtonElement {
    return fixture.nativeElement.querySelector('[aria-current="page"]') as HTMLButtonElement;
  }

  function controlButton(label: string): HTMLButtonElement {
    return fixture.nativeElement.querySelector(
      `button[aria-label="${label}"]`,
    ) as HTMLButtonElement;
  }
});
