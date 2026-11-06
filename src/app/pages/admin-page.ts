import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Api, errorMessage, dateTime, euro } from '../core/api';
interface FilmRow {
  id: string;
  title: string;
  synopsis: string;
  duration_minutes: number;
  genre: string;
  poster_url: string | null;
  published: boolean;
}
interface RoomRow {
  id: string;
  name: string;
  capacity: number;
}
interface ShowRow {
  id: string;
  film_id: string;
  room_id: string;
  title: string;
  room_name: string;
  starts_at: string;
  price_cents: number;
  cancelled: boolean;
}
@Component({
  imports: [FormsModule, RouterLink],
  template: ` <section class="page">
    <p class="eyebrow">LE GRAND CINÉMA · ADMINISTRATION</p>
    <h1>Le programme prend vie.</h1>
    <p>
      La durée du film et le temps de remise en état sont pris en compte pour chaque créneau. Les
      séances réservées sont protégées.
    </p>
    @if (error()) {
      <p role="alert" class="error">{{ error() }}</p>
    }
    @if (message()) {
      <p role="status">{{ message() }}</p>
    }
    <div class="panel">
      <h2>{{ filmId ? 'Modifier le film' : 'Ajouter un film' }}</h2>
      <form #filmForm="ngForm" (ngSubmit)="saveFilm()">
        <div class="form-grid">
          <label
            >Titre<input name="title" [(ngModel)]="film.title" required maxlength="200"
          /></label>
          <label
            >Genre<input name="genre" [(ngModel)]="film.genre" required maxlength="60"
          /></label>
          <label
            >Durée (minutes)<input
              type="number"
              name="duration"
              [(ngModel)]="film.durationMinutes"
              required
              min="1"
              max="600"
          /></label>
          <label
            >URL HTTPS de l’affiche (facultatif)<input
              type="url"
              name="poster"
              [(ngModel)]="film.posterUrl"
              maxlength="500"
              pattern="https://.*"
          /></label>
        </div>
        <label
          >Synopsis<textarea
            name="synopsis"
            [(ngModel)]="film.synopsis"
            required
            maxlength="10000"
          ></textarea>
        </label>
        <label class="check"
          ><input type="checkbox" name="published" [(ngModel)]="film.published" />Publié</label
        >
        <button class="primary" [disabled]="busy() || filmForm.invalid">Enregistrer le film</button>
        @if (filmId) {
          <button type="button" class="text-button" (click)="resetFilm()">
            Annuler la modification
          </button>
        }
      </form>
    </div>
    <div class="table-wrap">
      <table>
        <caption>
          Catalogue, y compris les films non publiés
        </caption>
        <thead>
          <tr>
            <th>Film</th>
            <th>Durée</th>
            <th>Publication</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          @for (f of films(); track f.id) {
            <tr>
              <td>{{ f.title }}</td>
              <td>{{ f.duration_minutes }} min</td>
              <td>{{ f.published ? 'Publié' : 'Masqué' }}</td>
              <td>
                <button class="text-button" [disabled]="busy()" (click)="editFilm(f)">
                  Modifier</button
                ><button class="text-button" [disabled]="busy()" (click)="publish(f)">
                  {{ f.published ? 'Dépublier' : 'Publier' }}
                </button>
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>
    <div class="panel">
      <h2>{{ showId ? 'Modifier la séance' : 'Programmer une séance' }}</h2>
      <form #showForm="ngForm" (ngSubmit)="saveShow()">
        <div class="form-grid">
          <label
            >Film<select name="filmId" [(ngModel)]="show.filmId" required>
              <option value="">Choisir…</option>
              @for (f of films(); track f.id) {
                <option [value]="f.id">{{ f.title }}</option>
              }
            </select></label
          >
          <label
            >Salle<select name="roomId" [(ngModel)]="show.roomId" required>
              <option value="">Choisir…</option>
              @for (r of rooms(); track r.id) {
                <option [value]="r.id">{{ r.name }} · {{ r.capacity }} places</option>
              }
            </select></label
          >
          <label
            >Date et heure (fuseau de cet ordinateur)<input
              type="datetime-local"
              name="start"
              [(ngModel)]="show.localTime"
              required
          /></label>
          <label
            >Prix en centimes<input
              type="number"
              name="price"
              [(ngModel)]="show.priceCents"
              required
              min="0"
              max="100000"
              step="1"
          /></label>
        </div>
        <p class="muted">
          Affichage public en heure de Paris. Vérifiez le fuseau de votre ordinateur avant de
          programmer.
        </p>
        <button class="primary" [disabled]="busy() || showForm.invalid">
          Enregistrer la séance
        </button>
        @if (showId) {
          <button type="button" class="text-button" (click)="resetShow()">
            Annuler la modification
          </button>
        }
      </form>
    </div>
    <div class="table-wrap">
      <table>
        <caption>
          500 prochaines séances au maximum
        </caption>
        <thead>
          <tr>
            <th>Séance</th>
            <th>Salle</th>
            <th>Prix</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          @for (s of shows(); track s.id) {
            <tr>
              <td>
                {{ s.title }}<br />{{ dateTime(s.starts_at) }}
                @if (s.cancelled) {
                  <strong> · Annulée</strong>
                }
              </td>
              <td>{{ s.room_name }}</td>
              <td>{{ euro(s.price_cents) }}</td>
              <td>
                @if (!s.cancelled) {
                  <button class="text-button" [disabled]="busy()" (click)="editShow(s)">
                    Modifier</button
                  ><button class="text-button" [disabled]="busy()" (click)="cancel(s)">
                    Annuler la séance
                  </button>
                }
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>
    <a routerLink="/staff">Voir les réservations et les indicateurs →</a>
  </section>`,
})
export class AdminPage implements OnInit {
  api = inject(Api);
  films = signal<FilmRow[]>([]);
  rooms = signal<RoomRow[]>([]);
  shows = signal<ShowRow[]>([]);
  error = signal('');
  message = signal('');
  busy = signal(false);
  dateTime = dateTime;
  euro = euro;
  filmId = '';
  film = {
    title: '',
    synopsis: '',
    durationMinutes: 100,
    genre: '',
    posterUrl: '',
    published: false,
  };
  showId = '';
  show = { filmId: '', roomId: '', localTime: '', priceCents: 1100 };
  ngOnInit(): void {
    void this.load();
  }
  async load(): Promise<void> {
    try {
      const [f, r, s] = await Promise.all([
        this.api.get<FilmRow[]>('/admin/films'),
        this.api.get<RoomRow[]>('/admin/rooms'),
        this.api.get<ShowRow[]>('/admin/screenings'),
      ]);
      this.films.set(f);
      this.rooms.set(r);
      this.shows.set(s);
    } catch (e) {
      this.error.set(errorMessage(e));
    }
  }
  editFilm(f: FilmRow): void {
    this.filmId = f.id;
    this.film = {
      title: f.title,
      synopsis: f.synopsis,
      durationMinutes: f.duration_minutes,
      genre: f.genre,
      posterUrl: f.poster_url ?? '',
      published: f.published,
    };
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  resetFilm(): void {
    this.filmId = '';
    this.film = {
      title: '',
      synopsis: '',
      durationMinutes: 100,
      genre: '',
      posterUrl: '',
      published: false,
    };
  }
  async saveFilm(): Promise<void> {
    await this.action(async () => {
      await this.api.write(
        this.filmId ? 'PUT' : 'POST',
        '/admin/films' + (this.filmId ? '/' + this.filmId : ''),
        this.film,
      );
      this.resetFilm();
    });
  }
  async publish(f: FilmRow): Promise<void> {
    await this.action(async () => {
      await this.api.write('PATCH', '/admin/films/' + f.id + '/publication', {
        published: !f.published,
      });
    });
  }
  editShow(s: ShowRow): void {
    this.showId = s.id;
    const d = new Date(s.starts_at);
    this.show = {
      filmId: s.film_id,
      roomId: s.room_id,
      localTime: new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16),
      priceCents: s.price_cents,
    };
  }
  resetShow(): void {
    this.showId = '';
    this.show = { filmId: '', roomId: '', localTime: '', priceCents: 1100 };
  }
  async saveShow(): Promise<void> {
    await this.action(async () => {
      await this.api.write(
        this.showId ? 'PUT' : 'POST',
        '/admin/screenings' + (this.showId ? '/' + this.showId : ''),
        {
          filmId: this.show.filmId,
          roomId: this.show.roomId,
          startsAt: new Date(this.show.localTime).toISOString(),
          priceCents: this.show.priceCents,
        },
      );
      this.resetShow();
    });
  }
  async cancel(s: ShowRow): Promise<void> {
    if (
      window.confirm(
        'Annuler cette séance ? Cette action sera refusée si des places sont déjà réservées.',
      )
    )
      await this.action(async () => {
        await this.api.write('POST', '/admin/screenings/' + s.id + '/cancel', {});
      });
  }
  private async action(task: () => Promise<void>): Promise<void> {
    if (this.busy()) return;
    this.busy.set(true);
    this.error.set('');
    this.message.set('');
    try {
      await task();
      await this.load();
      this.message.set('Enregistrement effectué.');
    } catch (e) {
      this.error.set(errorMessage(e));
    } finally {
      this.busy.set(false);
    }
  }
}
