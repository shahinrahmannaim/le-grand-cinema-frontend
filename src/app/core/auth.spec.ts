import { TestBed } from '@angular/core/testing';
import { Api, Account } from './api';
import { Auth } from './auth';
const user: Account = { id: 'u', email: 'u@test.example', displayName: 'Client', role: 'CLIENT' };
describe('Session state', () => {
  const api = { get: vi.fn(), write: vi.fn() };
  beforeEach(() => {
    vi.resetAllMocks();
    TestBed.configureTestingModule({ providers: [{ provide: Api, useValue: api }] });
  });
  it('loads the existing session once and shares initialization', async () => {
    api.get.mockResolvedValue(user);
    const auth = TestBed.inject(Auth);
    await Promise.all([auth.load(), auth.load()]);
    expect(api.get).toHaveBeenCalledTimes(1);
    expect(auth.user()).toEqual(user);
    expect(auth.ready()).toBe(true);
    expect(auth.staff()).toBe(false);
  });
  it('treats a missing session as anonymous and can subsequently log in and out', async () => {
    api.get.mockRejectedValue(new Error('401'));
    const auth = TestBed.inject(Auth);
    await auth.load();
    expect(auth.user()).toBeNull();
    api.write.mockResolvedValue({ ...user, role: 'STAFF' });
    await auth.login('u@test.example', 'demo-password');
    expect(auth.staff()).toBe(true);
    await auth.logout();
    expect(auth.user()).toBeNull();
    expect(api.write).toHaveBeenLastCalledWith('POST', '/auth/logout', {});
  });
});
