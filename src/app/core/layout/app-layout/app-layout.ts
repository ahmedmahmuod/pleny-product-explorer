import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { AppFooter } from '../footer/footer';
import { AppHeader } from '../header/header';

@Component({
  selector: 'app-layout',
  imports: [RouterOutlet, AppHeader, AppFooter],
  templateUrl: './app-layout.html',
  styleUrl: './app-layout.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppLayout {}
