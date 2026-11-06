import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Api, errorMessage } from '../core/api';
import { Auth } from '../core/auth';
@Component({
  imports: [FormsModule],
  template: ` <section class="page narrow">
    <p class="eyebrow">VOTRE ESPACE CINÉMA</p>
    <h1>{{ register() ? 'Créer mon compte' : 'Heureux de vous revoir.' }}</h1>
    <p>Retrouvez vos réservations et vos billets au même endroit.</p>
    <form (ngSubmit)="submit()" #form="ngForm">
      @if (register()) {
        <label
          >Votre nom<input
            name="name"
            [(ngModel)]="name"
            required
            maxlength="100"
            autocomplete="name"
        /></label>
      }
      <label
        >Adresse e-mail<input
          type="email"
          name="email"
          [(ngModel)]="email"
          required
          maxlength="254"
          autocomplete="username"
      /></label>
      <label
        >Mot de passe<input
          type="password"
          name="password"
          [(ngModel)]="password"
          required
          [minlength]="register() ? 12 : 1"
          maxlength="72"
          [autocomplete]="register() ? 'new-password' : 'current-password'"
      /></label>
      @if (register()) {
        <small
          >12 caractères minimum. Utilisez un mot de passe réservé à cette démonstration.</small
        >
      }
      @if (error()) {
        <p role="alert" class="error">{{ error() }}</p>
      }
      <button class="primary" [disabled]="busy() || form.invalid">
        {{
          busy() ? 'Un instant…' : register() ? 'Créer le compte et se connecter' : 'Se connecter'
        }}
      </button>
    </form>
    <button class="text-button" (click)="register.set(!register()); error.set('')">
      {{ register() ? 'J’ai déjà un compte' : 'Créer un compte' }}
    </button>
  </section>`,
})
export class LoginPage {
  auth = inject(Auth);
  api = inject(Api);
  router = inject(Router);
  route = inject(ActivatedRoute);
  register = signal(false);
  busy = signal(false);
  error = signal('');
  email = '';
  password = '';
  name = '';
  async submit(): Promise<void> {
    this.busy.set(true);
    this.error.set('');
    try {
      if (this.register())
        await this.api.write('POST', '/auth/register', {
          email: this.email,
          password: this.password,
          displayName: this.name,
        });
      await this.auth.login(this.email, this.password);
      this.password = '';
      const next = this.route.snapshot.queryParamMap.get('next');
      await this.router.navigateByUrl(
        next?.startsWith('/') && !next.startsWith('//') ? next : '/tickets',
      );
    } catch (e) {
      this.error.set(errorMessage(e));
    } finally {
      this.busy.set(false);
    }
  }
}
