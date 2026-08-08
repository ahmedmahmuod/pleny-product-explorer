import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

interface PaginationItem {
  readonly key: string;
  readonly label: string;
  readonly page: number | null;
  readonly current: boolean;
}

@Component({
  selector: 'app-pagination',
  templateUrl: './pagination.html',
  styleUrl: './pagination.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Pagination {
  readonly currentPage = input.required<number>();
  readonly totalPages = input.required<number>();
  readonly ariaLabel = input('Product pages');
  readonly pageChange = output<number>();

  protected readonly hasPages = computed(() => this.totalPages() > 0);
  protected readonly canGoPrevious = computed(() => this.currentPage() > 1);
  protected readonly canGoNext = computed(() => this.currentPage() < this.totalPages());
  protected readonly items = computed(() =>
    getPaginationItems(this.currentPage(), this.totalPages()),
  );

  protected goToPage(page: number | null): void {
    if (page === null || page < 1 || page > this.totalPages() || page === this.currentPage()) {
      return;
    }

    this.pageChange.emit(page);
  }
}

function getPaginationItems(currentPage: number, totalPages: number): readonly PaginationItem[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => pageItem(index + 1, currentPage));
  }

  const items: PaginationItem[] = [pageItem(1, currentPage)];
  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);

  if (start > 2) {
    items.push(ellipsisItem('start'));
  }

  for (let page = start; page <= end; page += 1) {
    items.push(pageItem(page, currentPage));
  }

  if (end < totalPages - 1) {
    items.push(ellipsisItem('end'));
  }

  items.push(pageItem(totalPages, currentPage));

  return items;
}

function pageItem(page: number, currentPage: number): PaginationItem {
  return {
    key: `page-${page}`,
    label: String(page),
    page,
    current: page === currentPage,
  };
}

function ellipsisItem(position: 'start' | 'end'): PaginationItem {
  return {
    key: `ellipsis-${position}`,
    label: '...',
    page: null,
    current: false,
  };
}
