import { Component, DestroyRef, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { Api, Plan, Seat, Ticket, Booking, euro, dateTime, errorMessage } from '../core/api';
import { Auth } from '../core/auth';
@Component({
  imports: [RouterLink],
  styleUrl: './reservation-page.scss',
  template: ` <section class="page">
    <a routerLink="/">← Retour au programme</a>
    <p class="eyebrow">VOTRE PROCHAINE SÉANCE</p>
    @if (plan(); as p) {
      <h1>{{ p.title }}</h1>
      <p>{{ dateTime(p.startsAt) }} · {{ p.roomName }} · {{ euro(p.priceCents) }} / place</p>
      @if (counter) {
        <p class="notice">
          Mode guichet · Le même stock est partagé avec les réservations en ligne.
        </p>
      }
      <div class="booking-layout">
        <div>
          <p class="screen">ÉCRAN</p>
          <p class="legend">□ Libre · ✓ Sélectionnée · × Occupée</p>
          <p role="status" [class.error]="!connected()">
            {{
              connected()
                ? 'Disponibilité en direct'
                : 'Direct interrompu : reconnexion en cours. Le serveur vérifiera chaque siège.'
            }}
          </p>
          <div class="seat-map" aria-label="Plan des sièges">
            @for (row of rows(); track row) {
              <div class="seat-row">
                <span aria-hidden="true">R{{ row }}</span>
                @for (seat of rowSeats(row); track seat.id) {
                  <button
                    type="button"
                    class="seat"
                    [class.taken]="seat.occupied"
                    [class.chosen]="selected().includes(seat.id)"
                    [disabled]="seat.occupied || busy() || !!pending()"
                    [attr.aria-pressed]="selected().includes(seat.id)"
                    [attr.aria-label]="seatLabel(seat)"
                    (click)="toggle(seat)"
                  >
                    {{ seat.occupied ? '×' : selected().includes(seat.id) ? '✓' : seat.seatNumber }}
                  </button>
                }
              </div>
            }
          </div>
        </div>
        <aside class="summary">
          <p class="eyebrow">VOTRE SÉLECTION</p>
          <h2>{{ selected().length }} place(s)</h2>
          <p>{{ seatNames() || 'Choisissez vos sièges sur le plan.' }}</p>
          <p>Votre sélection ne bloque pas les places.</p>
          <p class="total">{{ euro(selected().length * p.priceCents) }}</p>
          <p>Paiement au cinéma. Aucun paiement en ligne.</p>
          @if (error()) {
            <p role="alert" class="error">{{ error() }}</p>
          }
          @if (pending() && !busy()) {
            <p>
              La dernière confirmation est incertaine. Réessayez avec la même demande pour retrouver
              le billet sans créer de doublon.
            </p>
          }
          <button
            class="primary"
            [disabled]="busy() || (!pending() && !selected().length)"
            (click)="confirm()"
          >
            {{
              busy()
                ? 'Confirmation…'
                : pending()
                  ? 'Vérifier ma confirmation'
                  : auth.user()
                    ? 'Confirmer la réservation'
                    : 'Se connecter pour réserver'
            }}
          </button>
          @if (!pending()) {
            <button class="text-button" [disabled]="busy()" (click)="load()">
              Actualiser les places
            </button>
          }
        </aside>
      </div>
    } @else if (error()) {
      <p role="alert" class="error">{{ error() }}</p>
      <button class="primary" (click)="load()">Réessayer</button>
    } @else {
      <p role="status">Chargement du plan…</p>
    }
  </section>`,
})
export class ReservationPage implements OnInit {
  api = inject(Api);
  auth = inject(Auth);
  route = inject(ActivatedRoute);
  router = inject(Router);
  destroy = inject(DestroyRef);
  plan = signal<Plan | null>(null);
  selected = signal<string[]>([]);
  busy = signal(false);
  error = signal('');
  connected = signal(false);
  pending = signal<Booking | null>(null);
  rows = computed(() => [...new Set(this.plan()?.seats.map((s) => s.rowNumber) ?? [])]);
  id = this.route.snapshot.paramMap.get('id')!;
  counter = this.route.snapshot.queryParamMap.get('channel') === 'counter';
  private events?: EventSource;
  private generation = 0;
  private destroyed = false;
  euro = euro;
  dateTime = dateTime;
  ngOnInit(): void {
    void this.load();
    if (typeof EventSource !== 'undefined') {
      this.events = new EventSource(
        this.api.base + '/catalog/screenings/' + encodeURIComponent(this.id) + '/events',
        { withCredentials: true },
      );
      this.events.onopen = () => {
        this.connected.set(true);
        void this.load();
      };
      this.events.addEventListener('refresh', () => {
        void this.load();
      });
      this.events.onerror = () => this.connected.set(false);
    }
    this.destroy.onDestroy(() => {
      this.destroyed = true;
      this.events?.close();
    });
  }
  async load(): Promise<void> {
    const generation = ++this.generation;
    try {
      const p = await this.api.get<Plan>(
        '/catalog/screenings/' + encodeURIComponent(this.id) + '/seats',
      );
      if (this.destroyed || generation !== this.generation) return;
      this.plan.set(p);
      if (!this.pending() && !this.busy()) {
        const available = this.selected().filter((id) =>
          p.seats.some((s) => s.id === id && !s.occupied),
        );
        if (available.length !== this.selected().length)
          this.error.set('Certaines places ont été prises. Choisissez à nouveau.');
        this.selected.set(available);
      }
    } catch (e) {
      if (generation === this.generation) this.error.set(errorMessage(e));
    }
  }
  rowSeats(row: number): Seat[] {
    return this.plan()?.seats.filter((s) => s.rowNumber === row) ?? [];
  }
  seatLabel(s: Seat): string {
    return (
      'Rangée ' +
      s.rowNumber +
      ', siège ' +
      s.seatNumber +
      ', ' +
      (s.occupied ? 'occupé' : this.selected().includes(s.id) ? 'sélectionné' : 'libre')
    );
  }
  seatNames(): string {
    return (
      this.plan()
        ?.seats.filter((s) => this.selected().includes(s.id))
        .map((s) => 'R' + s.rowNumber + ' / ' + s.seatNumber)
        .join(', ') ?? ''
    );
  }
  toggle(s: Seat): void {
    if (s.occupied || this.busy() || this.pending()) return;
    this.error.set('');
    if (this.selected().includes(s.id))
      this.selected.update((ids) => ids.filter((id) => id !== s.id));
    else if (this.selected().length < 10) this.selected.update((ids) => [...ids, s.id]);
    else this.error.set('10 places maximum par réservation.');
  }
  async confirm(): Promise<void> {
    if (!this.auth.user()) {
      await this.router.navigate(['/login'], { queryParams: { next: this.router.url } });
      return;
    }
    if (this.counter && !this.auth.staff()) {
      this.error.set('Le mode guichet est réservé au personnel.');
      return;
    }
    if (this.busy() || (!this.pending() && !this.selected().length)) return;
    this.pending.set(
      this.pending() ?? {
        screeningId: this.id,
        seatIds: [...this.selected()].sort(),
        idempotencyKey: crypto.randomUUID(),
      },
    );
    this.busy.set(true);
    this.error.set('');
    try {
      const ticket = await this.api.write<Ticket>(
        'POST',
        this.counter ? '/staff/reservations' : '/reservations',
        this.pending(),
      );
      this.pending.set(null);
      await this.router.navigate(['/tickets', ticket.id]);
    } catch (e) {
      this.error.set(errorMessage(e));
      // Only definitive client failures permit a changed request. A lost response must reuse the original key and payload.
      if (e instanceof HttpErrorResponse && e.status >= 400 && e.status < 500) {
        this.pending.set(null);
        this.selected.set([]);
      }
    } finally {
      this.busy.set(false);
      void this.load();
    }
  }
}
