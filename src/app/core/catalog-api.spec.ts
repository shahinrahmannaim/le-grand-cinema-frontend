import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { CatalogApi } from './catalog-api';

describe('CatalogApi', () => {
  let http: HttpTestingController;
  let api: CatalogApi;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
    api = TestBed.inject(CatalogApi);
  });
  afterEach(() => http.verify());
  it('preserves the selected cinema date across timezones', () => {
    api.screenings('film-1', '2026-10-25').subscribe((result) => expect(result).toEqual([]));
    const request = http.expectOne('/api/catalog/films/film-1/screenings?date=2026-10-25');
    expect(request.request.method).toBe('GET');
    request.flush([]);
  });
  it('propagates a server failure instead of pretending the programme is empty', () => {
    api.films().subscribe({
      next: () => {
        throw new Error('Expected failure');
      },
      error: (error) => expect(error.status).toBe(503),
    });
    http.expectOne('/api/catalog/films').flush({}, { status: 503, statusText: 'Unavailable' });
  });
});
