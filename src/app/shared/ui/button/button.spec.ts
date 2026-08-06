import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Button, ButtonSize, ButtonType, ButtonVariant } from './button';

@Component({
  imports: [Button],
  template: `
    <app-button
      [variant]="variant()"
      [size]="size()"
      [type]="type()"
      [disabled]="disabled()"
      [loading]="loading()"
      [loadingLabel]="loadingLabel()"
      (click)="clickCount = clickCount + 1"
    >
      Save changes
    </app-button>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class ButtonTestHost {
  readonly variant = signal<ButtonVariant>('primary');
  readonly size = signal<ButtonSize>('medium');
  readonly type = signal<ButtonType>('button');
  readonly disabled = signal(false);
  readonly loading = signal(false);
  readonly loadingLabel = signal('Saving changes');

  clickCount = 0;
}

describe('Button', () => {
  let fixture: ComponentFixture<ButtonTestHost>;
  let host: ButtonTestHost;

  const nativeButton = (): HTMLButtonElement =>
    fixture.nativeElement.querySelector('button') as HTMLButtonElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ButtonTestHost],
    }).compileComponents();

    fixture = TestBed.createComponent(ButtonTestHost);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders projected content with safe native defaults', () => {
    const button = nativeButton();

    expect(button.textContent).toContain('Save changes');
    expect(button.type).toBe('button');
    expect(button.dataset['variant']).toBe('primary');
    expect(button.dataset['size']).toBe('medium');
    expect(button.disabled).toBe(false);
    expect(button.getAttribute('aria-busy')).toBeNull();
  });

  it('forwards the selected variant, size, and native type', () => {
    host.variant.set('secondary');
    host.size.set('large');
    host.type.set('submit');
    fixture.detectChanges();

    const button = nativeButton();

    expect(button.dataset['variant']).toBe('secondary');
    expect(button.dataset['size']).toBe('large');
    expect(button.type).toBe('submit');
  });

  it('uses the native click event and blocks activation when disabled', () => {
    nativeButton().click();
    expect(host.clickCount).toBe(1);

    host.disabled.set(true);
    fixture.detectChanges();
    nativeButton().click();

    expect(nativeButton().disabled).toBe(true);
    expect(host.clickCount).toBe(1);
  });

  it('disables interaction and announces loading without removing the label', () => {
    host.loading.set(true);
    fixture.detectChanges();

    const button = nativeButton();
    const status = fixture.nativeElement.querySelector('[role="status"]') as HTMLElement;

    expect(button.disabled).toBe(true);
    expect(button.getAttribute('aria-busy')).toBe('true');
    expect(button.querySelector('.button__label')?.textContent).toContain('Save changes');
    expect(button.querySelector('.button__spinner')).not.toBeNull();
    expect(status.textContent).toContain('Saving changes');

    button.click();
    expect(host.clickCount).toBe(0);
  });

  it('restores interaction and removes transient loading semantics', () => {
    host.loading.set(true);
    fixture.detectChanges();

    host.loading.set(false);
    fixture.detectChanges();

    expect(nativeButton().disabled).toBe(false);
    expect(nativeButton().getAttribute('aria-busy')).toBeNull();
    expect(fixture.nativeElement.querySelector('[role="status"]')).toBeNull();
  });
});
