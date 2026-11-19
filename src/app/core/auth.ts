import { inject, Injectable, signal } from '@angular/core';
import { Api, Account } from './api';
@Injectable({ providedIn: 'root' })
export class Auth {
  private api = inject(Api);
  readonly user = signal<Account | null>(null);
  readonly ready = signal(false);
  private initial?: Promise<void>;
  load(): Promise<void> {
    return (this.initial ??= this.api
      .get<Account>('/auth/me')
      .then((u) => {
        this.user.set(u);
      })
      .catch(() => {
        this.user.set(null);
      })
      .finally(() => this.ready.set(true)));
  }
  async login(email: string, password: string): Promise<void> {
    this.user.set(await this.api.write<Account>('POST', '/auth/login', { email, password }));
    this.ready.set(true);
  }
  async logout(): Promise<void> {
    await this.api.write('POST', '/auth/logout', {});
    this.user.set(null);
  }
  staff(): boolean {
    return ['ADMIN', 'STAFF'].includes(this.user()?.role ?? '');
  }
}
