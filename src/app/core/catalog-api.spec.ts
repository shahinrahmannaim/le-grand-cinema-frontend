import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { CatalogApi } from './catalog-api';
describe('Catalogue errors', () => {
  it('preserves API failure instead of returning an empty programme', () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const http = TestBed.inject(HttpTestingController);
    TestBed.inject(CatalogApi)
      .films()
      .subscribe({ error: (error) => expect(error.status).toBe(503) });
    http.expectOne('/api/catalog/films').flush({}, { status: 503, statusText: 'Unavailable' });
    http.verify();
  });
});
