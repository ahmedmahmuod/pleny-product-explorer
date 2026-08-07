import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import {
  disabled,
  type FieldTree,
  form,
  FormField,
  required,
  validate,
} from '@angular/forms/signals';
import { Router } from '@angular/router';
import { AuthStore } from '../../../core/auth/stores/auth.store';
import { getSafeAuthReturnUrl } from '../../../core/auth/utils/auth-return-url';
import { Button } from '../../../shared/ui/button/button';
import { TextField } from '../../../shared/ui/text-field/text-field';
import { AuthCredentials } from '../../../core/auth/models/auth.models';

@Component({
  selector: 'app-login-page',
  imports: [FormField, Button, TextField],
  templateUrl: './login.html',
  styleUrl: './login.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginPage {
  readonly returnUrl = input<string | undefined>();
  protected readonly authStore = inject(AuthStore);
  private readonly router = inject(Router);
  private readonly loginModel = signal<AuthCredentials>({ username: '', password: '' });

  // Angular 21 Signal Forms is experimental, so its use is isolated to this route-level form.
  protected readonly loginForm = form(
    this.loginModel,
    (credentials) => {
      required(credentials.username, { message: 'Username is required.' });
      validate(credentials.username, ({ value }) =>
        value() && !value().trim()
          ? { kind: 'required', message: 'Username is required.' }
          : undefined,
      );
      required(credentials.password, { message: 'Password is required.' });
      disabled(credentials.username, () => this.authStore.isLoading());
      disabled(credentials.password, () => this.authStore.isLoading());
    },
    { name: 'login' },
  );

  protected readonly usernameError = computed(() =>
    this.validationMessage(this.loginForm.username),
  );
  protected readonly passwordError = computed(() =>
    this.validationMessage(this.loginForm.password),
  );
  protected readonly safeReturnUrl = computed(() =>
    getSafeAuthReturnUrl(this.returnUrl() ?? '/products'),
  );

  // Router navigation is an external side effect of the authenticated session transition.
  private readonly redirectWhenAuthenticated = effect(() => {
    if (this.authStore.isAuthenticated()) {
      void this.router.navigateByUrl(this.safeReturnUrl());
    }
  });

  protected submit(event: Event): void {
    event.preventDefault();

    const username = this.loginForm.username();
    const password = this.loginForm.password();

    username.markAsTouched();
    password.markAsTouched();

    if (this.loginForm().invalid()) {
      if (username.invalid()) {
        username.focusBoundControl();
      } else {
        password.focusBoundControl();
      }

      return;
    }

    const credentials = this.loginModel();

    this.authStore.login({ username: credentials.username.trim(), password: credentials.password });
  }

  private validationMessage(field: FieldTree<string>): string | null {
    const state = field();

    if (!state.touched()) {
      return null;
    }

    return state.errors()[0]?.message ?? null;
  }
}
