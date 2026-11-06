import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';

describe('Application accessibility shell', () => {
  it('provides a skip link targeting the main content landmark', async () => {
    TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const target = fixture.nativeElement.querySelector('a.skip-link').getAttribute('href');
    expect(target).toBe('#main');
    expect(fixture.nativeElement.querySelector('main' + target)).not.toBeNull();
  });
});
