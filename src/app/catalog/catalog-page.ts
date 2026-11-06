import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CatalogApi, Film } from '../core/catalog-api';
@Component({
  selector: 'app-catalog-page',
  templateUrl: './catalog-page.html',
  styleUrl: './catalog-page.scss',
})
export class CatalogPage implements OnInit {
  private readonly api = inject(CatalogApi);
  private readonly destroyRef = inject(DestroyRef);
  readonly films = signal<Film[]>([]);
  readonly loading = signal(true);
  readonly error = signal(false);
  ngOnInit(): void {
    this.loadFilms();
  }
  loadFilms(): void {
    this.loading.set(true);
    this.error.set(false);
    this.api
      .films()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (films) => {
          this.films.set(films);
          this.loading.set(false);
        },
        error: () => {
          this.error.set(true);
          this.loading.set(false);
        },
      });
  }
}
