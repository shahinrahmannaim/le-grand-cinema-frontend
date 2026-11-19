import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { LoginPage } from './login-page';
import { Auth } from '../core/auth';
import { Api } from '../core/api';

describe('Password visibility', () => {
  it('toggles without submitting or changing the password, in login and registration', async () => {
    const api = { write: vi.fn() };
    const auth = { login: vi.fn() };
    TestBed.configureTestingModule({
      imports: [LoginPage],
      providers: [
        provideRouter([]),
        { provide: Api, useValue: api },
        { provide: Auth, useValue: auth },
      ],
    });
    const fixture = TestBed.createComponent(LoginPage);
    await fixture.whenStable();
    fixture.detectChanges();
    await fixture.whenStable();
    const input = fixture.nativeElement.querySelector('#password') as HTMLInputElement;
    input.value = 'Example12345';
    input.dispatchEvent(new Event('input'));
    await fixture.whenStable();
    const toggle = fixture.nativeElement.querySelector('.password-toggle') as HTMLButtonElement;
    expect(input.type).toBe('password');
    expect(toggle.type).toBe('button');
    toggle.click();
    fixture.detectChanges();
    expect(input.type).toBe('text');
    expect(input.value).toBe('Example12345');
    expect(toggle.getAttribute('aria-label')).toBe('Masquer le mot de passe');
    toggle.click();
    fixture.componentInstance.register.set(true);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(input.type).toBe('password');
    expect(input.minLength).toBe(12);
    toggle.click();
    fixture.detectChanges();
    expect(input.type).toBe('text');
    expect(input.autocomplete).toBe('new-password');
    expect(api.write).not.toHaveBeenCalled();
    expect(auth.login).not.toHaveBeenCalled();
  });
});
