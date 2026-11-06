import { TestBed } from '@angular/core/testing';
import { provideHttpClient, HttpErrorResponse } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { Api, errorMessage } from './api';
describe('API security contract', () => {
  let api: Api;
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(Api);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());
  it('retrieves a fresh session CSRF token before a write and sends credentials', async () => {
    const result = api.write('POST', '/reservations', { seatIds: ['a'] });
    const csrf = http.expectOne('/api/auth/csrf');
    expect(csrf.request.withCredentials).toBe(true);
    csrf.flush({ token: 'masked-token', headerName: 'X-CSRF-TOKEN' });
    await Promise.resolve();
    const mutation = http.expectOne('/api/reservations');
    expect(mutation.request.headers.get('X-CSRF-TOKEN')).toBe('masked-token');
    expect(mutation.request.withCredentials).toBe(true);
    expect(mutation.request.body).toEqual({ seatIds: ['a'] });
    mutation.flush({ id: 'ticket' });
    await expect(result).resolves.toEqual({ id: 'ticket' });
  });
  it('does not send a write when obtaining CSRF fails', async () => {
    const result = api.write('POST', '/admin/films', {});
    const assertion = expect(result).rejects.toBeInstanceOf(HttpErrorResponse);
    http.expectOne('/api/auth/csrf').flush({}, { status: 503, statusText: 'Unavailable' });
    await assertion;
    http.expectNone('/api/admin/films');
  });
  it('shows a precise conflict without exposing an arbitrary server object', () => {
    expect(
      errorMessage(new HttpErrorResponse({ status: 409, error: { detail: 'Siège occupé' } })),
    ).toBe('Siège occupé');
    expect(
      errorMessage(new HttpErrorResponse({ status: 500, error: { stack: 'private' } })),
    ).not.toContain('private');
  });
});
