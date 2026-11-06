import { TestBed } from '@angular/core/testing';
import {
  Router,
  provideRouter,
  CanActivateFn,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
} from '@angular/router';
import { signal } from '@angular/core';
import { routes } from './app.routes';
import { Auth } from './core/auth';
describe('Navigation guards', () => {
  const auth = {
    load: vi.fn().mockResolvedValue(undefined),
    user: signal<{ role: string } | null>(null),
    staff: () => ['STAFF', 'ADMIN'].includes(auth.user()?.role ?? ''),
  };
  beforeEach(() => {
    auth.user.set(null);
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: Auth, useValue: auth }],
    });
  });
  async function guard(path: string) {
    const fn = routes.find((r) => r.path === path)!.canActivate![0] as CanActivateFn;
    return TestBed.runInInjectionContext(() =>
      fn({} as ActivatedRouteSnapshot, { url: '/tickets/private' } as RouterStateSnapshot),
    );
  }
  it('sends an anonymous visitor to login and preserves the local destination', async () => {
    const result = await guard('tickets');
    expect(TestBed.inject(Router).serializeUrl(result as never)).toContain(
      'next=%2Ftickets%2Fprivate',
    );
  });
  it('permits an authenticated client to view their tickets', async () => {
    auth.user.set({ role: 'CLIENT' });
    expect(await guard('tickets')).toBe(true);
  });
  it('requires staff for pilotage and admin for administration', async () => {
    auth.user.set({ role: 'CLIENT' });
    expect(await guard('staff')).not.toBe(true);
    auth.user.set({ role: 'STAFF' });
    expect(await guard('staff')).toBe(true);
    expect(await guard('admin')).not.toBe(true);
    auth.user.set({ role: 'ADMIN' });
    expect(await guard('admin')).toBe(true);
  });
});
