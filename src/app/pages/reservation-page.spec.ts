import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, provideRouter } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { signal } from '@angular/core';
import { ReservationPage } from './reservation-page';
import { Api, Plan } from '../core/api';
import { Auth } from '../core/auth';
const plan: Plan = {
  screeningId: 'show',
  title: 'Film',
  roomName: 'Salle',
  startsAt: '2026-12-01T18:00:00Z',
  priceCents: 1100,
  seats: [
    { id: 'free', rowNumber: 1, seatNumber: 1, occupied: false },
    { id: 'taken', rowNumber: 1, seatNumber: 2, occupied: true },
  ],
};
describe('Seat selection and reliable confirmation', () => {
  const api = { base: '/api', get: vi.fn(), write: vi.fn() };
  const auth = { user: signal({ role: 'CLIENT' }), staff: () => false };
  beforeEach(() => {
    vi.resetAllMocks();
    api.get.mockResolvedValue(structuredClone(plan));
    auth.user.set({ role: 'CLIENT' });
    TestBed.configureTestingModule({
      imports: [ReservationPage],
      providers: [
        provideRouter([]),
        { provide: Api, useValue: api },
        { provide: Auth, useValue: auth },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: new Map([['id', 'show']]), queryParamMap: new Map() } },
        },
      ],
    });
  });
  it('labels every seat with its row, number and state, disabling occupied seats', async () => {
    const fixture = TestBed.createComponent(ReservationPage);
    await fixture.whenStable();
    fixture.detectChanges();
    const buttons = fixture.nativeElement.querySelectorAll('.seat');
    expect(buttons[0].getAttribute('aria-label')).toContain('Rangée 1, siège 1, libre');
    expect(buttons[1].disabled).toBe(true);
    buttons[0].click();
    fixture.detectChanges();
    expect(buttons[0].getAttribute('aria-pressed')).toBe('true');
    expect(fixture.nativeElement.querySelector('.total').textContent).toContain('11,00');
  });
  it('reuses the same payload and idempotency key after a lost server response', async () => {
    const page = TestBed.createComponent(ReservationPage).componentInstance;
    page.plan.set(structuredClone(plan));
    page.toggle(plan.seats[0]);
    api.write
      .mockRejectedValueOnce(new HttpErrorResponse({ status: 0 }))
      .mockResolvedValueOnce({ id: 'ticket' });
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    await page.confirm();
    const original = structuredClone(api.write.mock.calls[0][2]);
    expect(page.pending()).toEqual(original);
    page.toggle(plan.seats[0]);
    expect(page.selected()).toEqual(['free']);
    await page.confirm();
    expect(api.write.mock.calls[1][2]).toEqual(original);
    expect(navigate).toHaveBeenCalledWith(['/tickets', 'ticket']);
  });
  it('clears a rejected selection after a definitive conflict and refreshes availability', async () => {
    const page = TestBed.createComponent(ReservationPage).componentInstance;
    page.plan.set(structuredClone(plan));
    page.toggle(plan.seats[0]);
    api.write.mockRejectedValue(
      new HttpErrorResponse({ status: 409, error: { detail: 'Siège occupé' } }),
    );
    await page.confirm();
    expect(page.pending()).toBeNull();
    expect(page.selected()).toEqual([]);
    expect(page.error()).toContain('Siège occupé');
    expect(api.get).toHaveBeenCalled();
  });
  it('ignores stale availability responses', async () => {
    const page = TestBed.createComponent(ReservationPage).componentInstance;
    let resolveOld!: (p: Plan) => void;
    api.get
      .mockImplementationOnce(
        () =>
          new Promise<Plan>((resolve) => {
            resolveOld = resolve;
          }),
      )
      .mockResolvedValueOnce({ ...plan, title: 'Latest' });
    const old = page.load();
    await page.load();
    resolveOld({ ...plan, title: 'Old' });
    await old;
    expect(page.plan()?.title).toBe('Latest');
  });
  it('submits seat IDs in sorted order without changing the selection order', async () => {
    const secondSeat = {
      id: 'alpha',
      rowNumber: 1,
      seatNumber: 3,
      occupied: false,
    };
    const twoSeatPlan = structuredClone(plan);
    twoSeatPlan.seats.push(secondSeat);
    api.get.mockResolvedValue(twoSeatPlan);

    const fixture = TestBed.createComponent(ReservationPage);
    await fixture.whenStable();
    const page = fixture.componentInstance;

    page.toggle(twoSeatPlan.seats[0]);
    page.toggle(secondSeat);
    expect(page.selected()).toEqual(['free', 'alpha']);

    api.write.mockResolvedValueOnce({ id: 'ticket' });
    vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);

    await page.confirm();

    expect(api.write).toHaveBeenCalledWith(
      'POST',
      '/reservations',
      expect.objectContaining({
        screeningId: 'show',
        seatIds: ['alpha', 'free'],
        idempotencyKey: expect.any(String),
      }),
    );
    expect(page.selected()).toEqual(['free', 'alpha']);
  });
});
