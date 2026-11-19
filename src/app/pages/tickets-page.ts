import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Api, Ticket, dateTime, euro, errorMessage } from '../core/api';
@Component({
  imports: [RouterLink],
  template: ` <section class="page">
    <p class="eyebrow">VOTRE ESPACE</p>
    <h1>{{ id ? 'Votre billet' : 'Mes réservations' }}</h1>
    @if (error()) {
      <p role="alert" class="error">{{ error() }}</p>
      <button class="primary" (click)="load()">Réessayer</button>
    }
    @if (loading()) {
      <p role="status">Chargement des billets…</p>
    }
    @for (t of tickets(); track t.id) {
      <article class="ticket">
        <p class="eyebrow">
          LE GRAND CINÉMA · {{ t.status === 'CONFIRMED' ? 'RÉSERVATION CONFIRMÉE' : 'ANNULÉE' }}
        </p>
        <h2>{{ t.title }}</h2>
        <p>{{ dateTime(t.startsAt) }} (heure de Paris)</p>
        <p>{{ t.roomName }}</p>
        <p>
          <strong>Places : {{ t.seats.join(', ') }}</strong>
        </p>
        <p>
          Total : {{ euro(t.totalCents) }} ·
          {{ t.channel === 'WEB' ? 'Réservation en ligne' : 'Guichet' }}
        </p>
        <p class="reference">{{ t.reference }}</p>
        @if (t.status === 'CONFIRMED') {
          <p>Présentez ce billet au cinéma. Paiement sur place.</p>
        }
        @if (id) {
          <button class="primary no-print" (click)="print()">Imprimer / Enregistrer en PDF</button>
        } @else {
          <a [routerLink]="['/tickets', t.id]">Ouvrir le billet →</a>
        }
      </article>
    }
    @if (!loading() && !error() && !tickets().length) {
      <p>Aucune réservation pour le moment.</p>
      <a routerLink="/">Découvrir les films →</a>
    }
  </section>`,
})
export class TicketsPage implements OnInit {
  api = inject(Api);
  route = inject(ActivatedRoute);
  id = this.route.snapshot.paramMap.get('id');
  tickets = signal<Ticket[]>([]);
  error = signal('');
  loading = signal(true);
  dateTime = dateTime;
  euro = euro;
  ngOnInit(): void {
    void this.load();
  }
  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set('');
    try {
      this.tickets.set(
        this.id
          ? [await this.api.get<Ticket>('/reservations/' + encodeURIComponent(this.id))]
          : await this.api.get<Ticket[]>('/reservations'),
      );
    } catch (e) {
      this.error.set(errorMessage(e));
    } finally {
      this.loading.set(false);
    }
  }
  print(): void {
    window.print();
  }
}
