import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { Api } from '../core/api';
import { AdminPage } from './admin-page';

const film = {
  id: 'film',
  title: 'Film',
  synopsis: 'Histoire',
  duration_minutes: 90,
  genre: 'Drame',
  poster_url: 'https://example.com/poster.jpg',
  published: false,
};

const screening = {
  id: 'screening',
  film_id: 'film',
  room_id: 'room',
  title: 'Film',
  room_name: 'Salle 1',
  starts_at: '2026-12-01T18:00:00.000Z',
  price_cents: 1100,
  cancelled: false,
};

describe('Admin catalogue and scheduling actions', () => {
  const api = { get: vi.fn(), write: vi.fn() };

  beforeEach(() => {
    vi.resetAllMocks();
    api.get.mockResolvedValue([]);
    api.write.mockResolvedValue({ id: 'created' });

    TestBed.configureTestingModule({
      imports: [AdminPage],
      providers: [provideRouter([]), { provide: Api, useValue: api }],
    });

    vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function createPage(): AdminPage {
    return TestBed.createComponent(AdminPage).componentInstance;
  }

  it('loads films, rooms and screenings from the administration API', async () => {
    const rooms = [{ id: 'room', name: 'Salle 1', capacity: 100 }];
    api.get.mockImplementation((path: string) =>
      Promise.resolve(
        path === '/admin/films' ? [film] : path === '/admin/rooms' ? rooms : [screening],
      ),
    );

    const page = createPage();
    await page.load();

    expect(page.films()).toEqual([film]);
    expect(page.rooms()).toEqual(rooms);
    expect(page.shows()).toEqual([screening]);
  });

  it('reports a loading failure without replacing existing catalogue data', async () => {
    const page = createPage();
    page.films.set([film]);
    api.get.mockRejectedValue(
      new HttpErrorResponse({
        status: 503,
        error: { detail: 'Catalogue indisponible' },
      }),
    );

    await page.load();

    expect(page.error()).toBe('Catalogue indisponible');
    expect(page.films()).toEqual([film]);
  });

  it.each([
    { id: '', method: 'POST', path: '/admin/films' },
    { id: 'film', method: 'PUT', path: '/admin/films/film' },
  ])('saves a film using $method and resets the editor', async ({ id, method, path }) => {
    const page = createPage();
    page.editFilm(film);
    page.filmId = id;
    const payload = { ...page.film };

    await page.saveFilm();

    expect(api.write).toHaveBeenCalledWith(method, path, payload);
    expect(page.filmId).toBe('');
    expect(page.film.title).toBe('');
    expect(page.film.posterUrl).toBe('');
    expect(page.film.published).toBe(false);
    expect(page.message()).toBe('Enregistrement effectué.');
    expect(page.busy()).toBe(false);
    expect(api.get).toHaveBeenCalledWith('/admin/films');
  });

  it('preserves the film editor when saving is rejected', async () => {
    const page = createPage();
    page.editFilm(film);
    const original = { ...page.film };
    api.write.mockRejectedValue(
      new HttpErrorResponse({
        status: 400,
        error: { detail: 'Durée invalide' },
      }),
    );

    await page.saveFilm();

    expect(page.filmId).toBe('film');
    expect(page.film).toEqual(original);
    expect(page.error()).toBe('Durée invalide');
    expect(page.message()).toBe('');
    expect(page.busy()).toBe(false);
    expect(api.get).not.toHaveBeenCalled();
  });

  it('does not delete a film when confirmation is declined', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    const page = createPage();
    page.editFilm(film);

    await page.removeFilm(film);

    expect(api.write).not.toHaveBeenCalled();
    expect(page.filmId).toBe('film');
  });

  it.each([
    { editingId: 'film', expectedId: '' },
    { editingId: 'another-film', expectedId: 'another-film' },
  ])(
    'deletes a confirmed film while preserving an unrelated editor: $editingId',
    async ({ editingId, expectedId }) => {
      vi.spyOn(window, 'confirm').mockReturnValue(true);
      const page = createPage();
      page.editFilm(film);
      page.filmId = editingId;

      await page.removeFilm(film);

      expect(api.write).toHaveBeenCalledWith('DELETE', '/admin/films/film', {});
      expect(page.filmId).toBe(expectedId);
      expect(page.busy()).toBe(false);
    },
  );

  it('publishes an unpublished film without altering its content', async () => {
    const page = createPage();

    await page.publish(film);

    expect(api.write).toHaveBeenCalledWith('PATCH', '/admin/films/film/publication', {
      published: true,
    });
    expect(film.published).toBe(false);
  });

  it('edits a screening and sends its local date back as the same instant', async () => {
    const page = createPage();
    page.editShow(screening);

    expect(page.showId).toBe(screening.id);
    expect(page.show.filmId).toBe(screening.film_id);
    expect(page.show.roomId).toBe(screening.room_id);
    expect(new Date(page.show.localTime).toISOString()).toBe(screening.starts_at);

    page.show.priceCents = 1250;
    await page.saveShow();

    expect(api.write).toHaveBeenCalledWith('PUT', '/admin/screenings/screening', {
      filmId: 'film',
      roomId: 'room',
      startsAt: screening.starts_at,
      priceCents: 1250,
    });
    expect(page.showId).toBe('');
    expect(page.show).toEqual({
      filmId: '',
      roomId: '',
      localTime: '',
      priceCents: 1100,
    });
  });

  it.each([false, true])('cancels a screening only when confirmation is %s', async (confirmed) => {
    vi.spyOn(window, 'confirm').mockReturnValue(confirmed);
    const page = createPage();

    await page.cancel(screening);

    if (confirmed) {
      expect(api.write).toHaveBeenCalledWith('POST', '/admin/screenings/screening/cancel', {});
      expect(page.message()).toBe('Enregistrement effectué.');
    } else {
      expect(api.write).not.toHaveBeenCalled();
      expect(api.get).not.toHaveBeenCalled();
    }
  });

  it('prevents a second write while the first submission is pending', async () => {
    let finish!: () => void;
    api.write.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        }),
    );
    const page = createPage();
    page.editFilm(film);
    page.error.set('Ancienne erreur');
    page.message.set('Ancien message');

    const firstSubmission = page.saveFilm();

    expect(page.busy()).toBe(true);
    expect(page.error()).toBe('');
    expect(page.message()).toBe('');

    await page.saveFilm();
    expect(api.write).toHaveBeenCalledTimes(1);

    finish();
    await firstSubmission;

    expect(page.busy()).toBe(false);
    expect(page.message()).toBe('Enregistrement effectué.');
  });
});
