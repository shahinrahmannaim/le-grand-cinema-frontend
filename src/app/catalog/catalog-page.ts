import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subscription } from 'rxjs';
import { CatalogApi, Film, Screening } from '../core/catalog-api';
@Component({
  selector: 'app-catalog-page',
  templateUrl: './catalog-page.html',
  styleUrl: './catalog-page.scss',
})
export class CatalogPage implements OnInit {
  private readonly api = inject(CatalogApi);
  private readonly destroyRef = inject(DestroyRef);
  private screeningRequest?: Subscription;
  readonly films = signal<Film[]>([]);
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly selected = signal<Film | null>(null);
  readonly screenings = signal<Screening[]>([]);
  readonly screeningsLoading = signal(false);
  readonly screeningsError = signal(false);
  readonly selectedDate = signal(
    new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Paris' }).format(new Date()),
  );
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
  selectFilm(film: Film): void {
    this.selected.set(film);
    this.loadScreenings();
  }
  selectDate(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return;
    this.selectedDate.set(value);
    this.loadScreenings();
  }
  loadScreenings(): void {
    const film = this.selected();
    if (!film) return;
    this.screeningRequest?.unsubscribe();
    this.screenings.set([]);
    this.screeningsError.set(false);
    this.screeningsLoading.set(true);
    this.screeningRequest = this.api
      .screenings(film.id, this.selectedDate())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (screenings) => {
          this.screenings.set(screenings);
          this.screeningsLoading.set(false);
        },
        error: () => {
          this.screeningsError.set(true);
          this.screeningsLoading.set(false);
        },
      });
  }
  price(cents: number): string {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(
      cents / 100,
    );
  }
  time(instant: string): string {
    return new Intl.DateTimeFormat('fr-FR', {
      timeZone: 'Europe/Paris',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(instant));
  }
}
