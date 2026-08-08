import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Params, RouterLink } from '@angular/router';

export interface BreadcrumbItem {
  readonly id: string;
  readonly label: string;
  readonly route?: string;
  readonly queryParams?: Params;
  readonly current?: boolean;
}

@Component({
  selector: 'app-breadcrumb',
  imports: [RouterLink],
  templateUrl: './breadcrumb.html',
  styleUrl: './breadcrumb.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Breadcrumb {
  readonly items = input.required<readonly BreadcrumbItem[]>();
  readonly ariaLabel = input('Breadcrumb');
}
