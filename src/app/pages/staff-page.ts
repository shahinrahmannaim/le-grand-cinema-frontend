import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Api, dateTime, euro, errorMessage, today } from '../core/api';
interface ReservationRow {
  id: string;
  reference: string;
  title: string;
  starts_at: string;
  room_name: string;
  channel: string;
  status: string;
  seats: number;
  total_cents: number;
}
interface Search {
  items: ReservationRow[];
  page: number;
  pageSize: number;
  total: number;
}
interface Occupancy {
  id: string;
  starts_at: string;
  title: string;
  room_name: string;
  capacity: number;
  booked_seats: number;
  occupancy_percent: number;
}
interface Bucket {
  day: string;
  hour: number;
  weekend: boolean;
  screenings: number;
  booked_seats: number;
}
interface Analytics {
  current: Bucket[];
  baseline: Bucket[];
  limitation: string;
}
@Component({
  imports: [FormsModule, RouterLink],
  template: ` <section class="page">
    <p class="eyebrow">LE GRAND CINÉMA · PILOTAGE</p>
    <h1>Une vue claire, des décisions humaines.</h1>
    <p>
      Les indicateurs portent sur les places réservées. Ils ne mesurent pas les entrées réelles.
    </p>
    @if (error()) {
      <p role="alert" class="error">{{ error() }}</p>
    }
    @if (loading()) {
      <p role="status">Chargement…</p>
    }
    <div class="panel">
      <h2>Rechercher une réservation</h2>
      <form (ngSubmit)="search(0)">
        <div class="form-grid">
          <label
            >Référence (tout ou partie)<input
              name="reference"
              [(ngModel)]="reference"
              maxlength="32"
          /></label>
          <label
            >Identifiant de séance (facultatif)<input
              name="screeningId"
              [(ngModel)]="screeningId"
              pattern="[0-9a-fA-F-]{36}"
          /></label>
        </div>
        <button class="primary" [disabled]="loading()">Rechercher</button>
      </form>
      @if (results(); as result) {
        <p>{{ result.total }} réservation(s) · page {{ result.page + 1 }}</p>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Référence</th>
                <th>Séance</th>
                <th>Places</th>
                <th>Canal / statut</th>
              </tr>
            </thead>
            <tbody>
              @for (b of result.items; track b.id) {
                <tr>
                  <td>
                    <a [routerLink]="['/tickets', b.id]">{{ b.reference }}</a>
                  </td>
                  <td>{{ b.title }}<br />{{ dateTime(b.starts_at) }} · {{ b.room_name }}</td>
                  <td>{{ b.seats }} · {{ euro(b.total_cents) }}</td>
                  <td>{{ b.channel }} · {{ b.status }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
        @if (!result.items.length) {
          <p>Aucune réservation trouvée.</p>
        }
        <button
          class="text-button"
          [disabled]="loading() || result.page === 0"
          (click)="search(result.page - 1)"
        >
          ← Précédent
        </button>
        ·
        <button
          class="text-button"
          [disabled]="loading() || (result.page + 1) * result.pageSize >= result.total"
          (click)="search(result.page + 1)"
        >
          Suivant →
        </button>
      }
    </div>
    <div class="panel">
      <h2>Occupation et périodes</h2>
      <form (ngSubmit)="report()" #reportForm="ngForm">
        <div class="form-grid">
          <label>Du (inclus)<input type="date" name="from" [(ngModel)]="from" required /></label
          ><label>Au (inclus)<input type="date" name="to" [(ngModel)]="to" required /></label>
          <label
            >Seuil d’alerte (%)<input
              type="number"
              name="threshold"
              [(ngModel)]="threshold"
              min="0"
              max="100"
              required
          /></label>
          <label
            >Comparaison du (facultatif)<input
              type="date"
              name="baselineFrom"
              [(ngModel)]="baselineFrom" /></label
          ><label
            >Comparaison au<input type="date" name="baselineTo" [(ngModel)]="baselineTo"
          /></label>
        </div>
        <p class="muted">
          Périodes de 366 jours maximum. Pour un festival, choisissez ses dates et une période
          distincte de même durée. Seuil proposé : 80 %.
        </p>
        <button class="primary" [disabled]="loading() || reportForm.invalid">
          Actualiser les indicateurs
        </button>
      </form>
    </div>
    <h2>Occupation par séance</h2>
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Séance</th>
            <th>Salle</th>
            <th>Places réservées / capacité</th>
            <th>Occupation</th>
            <th>Guichet</th>
          </tr>
        </thead>
        <tbody>
          @for (s of occupancy(); track s.id) {
            <tr>
              <td>{{ s.title }}<br />{{ dateTime(s.starts_at) }}</td>
              <td>{{ s.room_name }}</td>
              <td>{{ s.booked_seats }} / {{ s.capacity }}</td>
              <td>
                {{ s.occupancy_percent }} %
                @if (+s.occupancy_percent >= threshold) {
                  <strong> · À surveiller</strong>
                }
              </td>
              <td>
                <a [routerLink]="['/reserve', s.id]" [queryParams]="{ channel: 'counter' }"
                  >Choisir des places</a
                >
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>
    @if (!occupancy().length) {
      <p>Aucune séance sur cette période.</p>
    }
    <p>Alerte consultative : aucune programmation n’est modifiée automatiquement.</p>
    @if (analytics(); as a) {
      <h2>Réservations par jour et heure</h2>
      <p>{{ a.limitation }}</p>
      <p>
        Période sélectionnée : <strong>{{ sum(a.current) }} places</strong> · Comparaison :
        <strong>{{ baselineFrom ? sum(a.baseline) + ' places' : 'non demandée' }}</strong>
      </p>
      @for (
        group of [
          { name: 'Période sélectionnée', rows: a.current },
          { name: 'Comparaison', rows: a.baseline },
        ];
        track group.name
      ) {
        <h3>{{ group.name }}</h3>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Jour (Paris)</th>
                <th>Heure</th>
                <th>Type</th>
                <th>Séances</th>
                <th>Places réservées</th>
              </tr>
            </thead>
            <tbody>
              @for (b of group.rows; track b.day + '-' + b.hour) {
                <tr>
                  <td>{{ b.day }}</td>
                  <td>{{ b.hour }} h</td>
                  <td>{{ b.weekend ? 'Week-end' : 'Semaine' }}</td>
                  <td>{{ b.screenings }}</td>
                  <td>{{ b.booked_seats }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
        @if (!group.rows.length) {
          <p>Aucune donnée de séance disponible.</p>
        }
      }
    }
  </section>`,
})
export class StaffPage implements OnInit {
  api = inject(Api);
  results = signal<Search | null>(null);
  occupancy = signal<Occupancy[]>([]);
  analytics = signal<Analytics | null>(null);
  error = signal('');
  loading = signal(false);
  reference = '';
  screeningId = '';
  from = today();
  to = today();
  threshold = 80;
  baselineFrom = '';
  baselineTo = '';
  dateTime = dateTime;
  euro = euro;
  ngOnInit(): void {
    void this.initial();
  }
  private async initial(): Promise<void> {
    await this.search(0);
    await this.report();
  }
  async search(page: number): Promise<void> {
    this.loading.set(true);
    this.error.set('');
    try {
      this.results.set(
        await this.api.get<Search>('/staff/reservations', {
          reference: this.reference,
          ...(this.screeningId ? { screeningId: this.screeningId } : {}),
          page,
        }),
      );
    } catch (e) {
      this.error.set(errorMessage(e));
    } finally {
      this.loading.set(false);
    }
  }
  async report(): Promise<void> {
    this.loading.set(true);
    this.error.set('');
    try {
      const params = { from: this.from, to: this.to };
      const [occupancy, analytics] = await Promise.all([
        this.api.get<Occupancy[]>('/staff/occupancy', params),
        this.api.get<Analytics>('/staff/analytics', {
          ...params,
          ...(this.baselineFrom ? { baselineFrom: this.baselineFrom } : {}),
          ...(this.baselineTo ? { baselineTo: this.baselineTo } : {}),
        }),
      ]);
      this.occupancy.set(occupancy);
      this.analytics.set(analytics);
    } catch (e) {
      this.error.set(errorMessage(e));
    } finally {
      this.loading.set(false);
    }
  }
  sum(rows: Bucket[]): number {
    return rows.reduce((total, row) => total + Number(row.booked_seats), 0);
  }
}
