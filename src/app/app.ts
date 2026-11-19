import { Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { Auth } from './core/auth';
import { errorMessage } from './core/api';
@Component({
  imports: [RouterOutlet, RouterLink],
  selector: 'app-root',
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App implements OnInit {
  auth = inject(Auth);
  router = inject(Router);
  error = signal('');
  ngOnInit(): void {
    void this.auth.load();
  }
  async logout(): Promise<void> {
    try {
      await this.auth.logout();
      await this.router.navigate(['/']);
    } catch (e) {
      this.error.set(errorMessage(e));
    }
  }
}
