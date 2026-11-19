import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Auth } from '../core/auth';

@Component({
  imports: [RouterLink],
  styles: `
    dl {
      margin: 0;
    }
    dt {
      color: var(--muted);
      margin-top: 20px;
    }
    dt:first-child {
      margin-top: 0;
    }
    dd {
      margin: 8px 0 0;
      overflow-wrap: anywhere;
    }
  `,
  template: `
    <section class="page narrow">
      <p class="eyebrow">VOTRE ESPACE CINÉMA</p>
      <h1>Mon profil</h1>
      @if (auth.user(); as user) {
        <div class="panel">
          <dl>
            <dt>Nom</dt>
            <dd>{{ user.displayName }}</dd>
            <dt>Adresse e-mail</dt>
            <dd>{{ user.email }}</dd>
            <dt>Type de compte</dt>
            <dd>{{ roles[user.role] }}</dd>
          </dl>
        </div>
        <a class="primary" routerLink="/tickets">Voir mes billets</a>
      }
    </section>
  `,
})
export class ProfilePage {
  readonly auth = inject(Auth);
  readonly roles = { CLIENT: 'Client', STAFF: 'Personnel', ADMIN: 'Administrateur' };
}
