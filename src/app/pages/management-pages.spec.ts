import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, provideRouter } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { Api } from '../core/api';
import { Auth } from '../core/auth';
import { AdminPage } from './admin-page';
import { StaffPage } from './staff-page';
import { TicketsPage } from './tickets-page';
import { LoginPage } from './login-page';
const ticket = {
  id: 'ticket',
  reference: 'GC-PRIVATE',
  title: 'Film',
  roomName: 'Salle 1',
  startsAt: '2026-12-01T18:00:00Z',
  status: 'CONFIRMED',
  channel: 'WEB',
  totalCents: 2200,
  seats: ['R1 · 1', 'R1 · 2'],
};
describe('Management, tickets and login', () => {
  const api = { get: vi.fn(), write: vi.fn() };
  const auth = { login: vi.fn() };
  beforeEach(() => {
    vi.resetAllMocks();
    api.write.mockResolvedValue({ id: 'created' });
    auth.login.mockResolvedValue(undefined);
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: Api, useValue: api },
        { provide: Auth, useValue: auth },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: new Map([['id', 'ticket']]), queryParamMap: new Map() },
          },
        },
      ],
    });
  });
  it('renders the full printable ticket from server data', async () => {
    api.get.mockResolvedValue(ticket);
    const fixture = TestBed.createComponent(TicketsPage);
    await fixture.whenStable();
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent;
    for (const value of ['GC-PRIVATE', 'R1 · 1', 'R1 · 2', '22,00', 'Salle 1'])
      expect(text).toContain(value);
    const print = vi.spyOn(window, 'print').mockImplementation(() => {});
    fixture.nativeElement.querySelector('button').click();
    expect(print).toHaveBeenCalled();
  });
  it('does not render a ticket when the server denies access', async () => {
    api.get.mockRejectedValue(new HttpErrorResponse({ status: 404 }));
    const fixture = TestBed.createComponent(TicketsPage);
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.ticket')).toBeNull();
    expect(fixture.nativeElement.querySelector('[role="alert"]')).not.toBeNull();
  });
  it('keeps invalid credentials on the login page and reports the failure', async () => {
    auth.login.mockRejectedValue(new HttpErrorResponse({ status: 401 }));
    const page = TestBed.createComponent(LoginPage).componentInstance;
    page.email = 'u@test.example';
    page.password = 'wrong';
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl');
    await page.submit();
    expect(navigate).not.toHaveBeenCalled();
    expect(page.error()).toContain('Connectez-vous');
    expect(page.busy()).toBe(false);
  });
  it('registers then authenticates, clears the password and uses a local destination', async () => {
    const page = TestBed.createComponent(LoginPage).componentInstance;
    page.register.set(true);
    page.name = 'Visiteur';
    page.email = 'v@test.example';
    page.password = 'demo-only-password';
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    await page.submit();
    expect(api.write).toHaveBeenCalledWith('POST', '/auth/register', {
      email: 'v@test.example',
      password: 'demo-only-password',
      displayName: 'Visiteur',
    });
    expect(auth.login).toHaveBeenCalled();
    expect(page.password).toBe('');
    expect(navigate).toHaveBeenCalledWith('/tickets');
  });
  it('submits screening price as integer cents and converts the local date to an instant', async () => {
    api.get.mockResolvedValue([]);
    const page = TestBed.createComponent(AdminPage).componentInstance;
    page.show = { filmId: 'film', roomId: 'room', localTime: '2026-12-01T18:00', priceCents: 1100 };
    await page.saveShow();
    expect(api.write).toHaveBeenCalledWith('POST', '/admin/screenings', {
      filmId: 'film',
      roomId: 'room',
      startsAt: new Date('2026-12-01T18:00').toISOString(),
      priceCents: 1100,
    });
    expect(page.message()).toContain('effectué');
  });
  it('preserves the admin form and exposes a scheduling conflict', async () => {
    api.write.mockRejectedValue(
      new HttpErrorResponse({ status: 409, error: { detail: 'Créneau occupé' } }),
    );
    const page = TestBed.createComponent(AdminPage).componentInstance;
    page.show = { filmId: 'film', roomId: 'room', localTime: '2026-12-01T18:00', priceCents: 1100 };
    await page.saveShow();
    expect(page.show.filmId).toBe('film');
    expect(page.error()).toBe('Créneau occupé');
    expect(page.busy()).toBe(false);
  });
  it('loads bounded searches and aggregates explicit comparison dates', async () => {
    api.get.mockImplementation((path: string) =>
      Promise.resolve(
        path === '/staff/reservations'
          ? { items: [], page: 0, pageSize: 25, total: 0 }
          : path === '/staff/occupancy'
            ? []
            : { current: [], baseline: [], limitation: 'Réservations uniquement' },
      ),
    );
    const page = TestBed.createComponent(StaffPage).componentInstance;
    page.reference = 'GC-1';
    await page.search(2);
    expect(api.get).toHaveBeenCalledWith('/staff/reservations', { reference: 'GC-1', page: 2 });
    page.from = '2026-12-10';
    page.to = '2026-12-12';
    page.baselineFrom = '2026-11-10';
    page.baselineTo = '2026-11-12';
    await page.report();
    expect(api.get).toHaveBeenCalledWith('/staff/analytics', {
      from: '2026-12-10',
      to: '2026-12-12',
      baselineFrom: '2026-11-10',
      baselineTo: '2026-11-12',
    });
    expect(page.sum([{ day: 'x', hour: 10, weekend: false, screenings: 1, booked_seats: 2 }])).toBe(
      2,
    );
  });
  it('renders the staff occupancy numerator, capacity and advisory without changing the schedule', async () => {
    api.get.mockImplementation((path: string) =>
      Promise.resolve(
        path === '/staff/reservations'
          ? { items: [], page: 0, pageSize: 25, total: 0 }
          : path === '/staff/occupancy'
            ? [
                {
                  id: 'show',
                  starts_at: '2026-12-01T18:00:00Z',
                  title: 'Film',
                  room_name: 'Salle',
                  capacity: 100,
                  booked_seats: 85,
                  occupancy_percent: 85,
                },
              ]
            : {
                current: [
                  { day: '2026-12-01', hour: 19, weekend: false, screenings: 1, booked_seats: 85 },
                ],
                baseline: [],
                limitation: 'Réservations uniquement',
              },
      ),
    );
    const fixture = TestBed.createComponent(StaffPage);
    await fixture.whenStable();
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('85 / 100');
    expect(text).toContain('À surveiller');
    expect(text).toContain('aucune programmation n’est modifiée automatiquement');
    expect(api.write).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('a[href*="channel=counter"]')).not.toBeNull();
  });
  it('renders editable catalogue data and permits publication independently of content editing', async () => {
    api.get.mockImplementation((path: string) =>
      Promise.resolve(
        path === '/admin/films'
          ? [
              {
                id: 'f',
                title: 'Film',
                synopsis: 'Histoire',
                duration_minutes: 90,
                genre: 'Drame',
                poster_url: null,
                published: true,
              },
            ]
          : [],
      ),
    );
    const fixture = TestBed.createComponent(AdminPage);
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Film');
    const page = fixture.componentInstance;
    vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    page.editFilm(page.films()[0]);
    expect(page.film.durationMinutes).toBe(90);
    await page.publish(page.films()[0]);
    expect(api.write).toHaveBeenCalledWith('PATCH', '/admin/films/f/publication', {
      published: false,
    });
  });
});
