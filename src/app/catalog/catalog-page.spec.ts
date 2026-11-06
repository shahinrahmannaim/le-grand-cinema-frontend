import { provideRouter } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { Subject, of, throwError } from 'rxjs';
import { CatalogPage } from './catalog-page';
import { CatalogApi, Film, Screening } from '../core/catalog-api';

const film: Film = {
  id: 'film-1',
  title: 'Une nuit',
  synopsis: 'Une histoire',
  durationMinutes: 105,
  genre: 'Drame',
  posterUrl: null,
};
describe('Catalogue', () => {
  const api = { films: vi.fn(), screenings: vi.fn() };
  beforeEach(() => {
    vi.resetAllMocks();
    api.films.mockReturnValue(of([film]));
    api.screenings.mockReturnValue(of([]));
    TestBed.configureTestingModule({
      imports: [CatalogPage],
      providers: [provideRouter([]), { provide: CatalogApi, useValue: api }],
    });
  });
  it('distinguishes failure from an empty programme and offers a retry', async () => {
    api.films.mockReturnValue(throwError(() => new Error('Network')));
    const fixture = TestBed.createComponent(CatalogPage);
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="alert"]')).not.toBeNull();
    api.films.mockReturnValue(of([]));
    fixture.nativeElement.querySelector('button').click();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Aucun film');
  });
  it('shows the selected film and an explicit empty-day message', async () => {
    const fixture = TestBed.createComponent(CatalogPage);
    await fixture.whenStable();
    fixture.detectChanges();
    fixture.nativeElement.querySelector('.poster').click();
    fixture.detectChanges();
    expect(api.screenings).toHaveBeenCalledWith(film.id, fixture.componentInstance.selectedDate());
    expect(fixture.nativeElement.textContent).toContain('Aucune séance disponible');
  });
  it('ignores a late response for a previously selected date', () => {
    const oldRequest = new Subject<Screening[]>();
    api.screenings.mockReturnValueOnce(oldRequest).mockReturnValueOnce(of([]));
    const fixture = TestBed.createComponent(CatalogPage);
    fixture.componentInstance.selectFilm(film);
    fixture.componentInstance.selectedDate.set('2026-11-08');
    fixture.componentInstance.loadScreenings();
    oldRequest.next([
      {
        id: 'old',
        filmId: film.id,
        roomName: 'Salle',
        startsAt: '2026-11-07T10:00:00Z',
        priceCents: 1000,
      },
    ]);
    expect(fixture.componentInstance.screenings()).toEqual([]);
  });
});
