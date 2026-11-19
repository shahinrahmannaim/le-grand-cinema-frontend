import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ProfilePage } from './profile-page';
import { Auth } from '../core/auth';

describe('Profile', () => {
  it('displays the signed-in account and a link to its tickets', async () => {
    TestBed.configureTestingModule({
      imports: [ProfilePage],
      providers: [
        provideRouter([]),
        {
          provide: Auth,
          useValue: {
            user: signal({ displayName: 'Shahin', email: 'client@example.test', role: 'CLIENT' }),
          },
        },
      ],
    });
    const fixture = TestBed.createComponent(ProfilePage);
    await fixture.whenStable();
    const page = fixture.nativeElement as HTMLElement;
    expect(page.textContent).toContain('Shahin');
    expect(page.textContent).toContain('client@example.test');
    expect(page.textContent).toContain('Client');
    expect(page.querySelector('a')?.getAttribute('href')).toBe('/tickets');
  });
});
