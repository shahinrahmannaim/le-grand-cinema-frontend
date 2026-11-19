import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { API_BASE_URL } from './app/core/catalog-api';
async function start(): Promise<void> {
  const response = await fetch('/config.json', { cache: 'no-cache' });
  if (!response.ok) throw new Error('Configuration unavailable');
  const config: { apiBaseUrl: unknown } = await response.json();
  if (
    typeof config.apiBaseUrl !== 'string' ||
    (config.apiBaseUrl !== '/api' && !/^https:\/\/[^\s]+\/api$/.test(config.apiBaseUrl))
  )
    throw new Error('Invalid API configuration');
  await bootstrapApplication(App, {
    ...appConfig,
    providers: [...appConfig.providers, { provide: API_BASE_URL, useValue: config.apiBaseUrl }],
  });
}
start().catch((error: unknown) => {
  console.error('Application startup failed', error);
  const root = document.querySelector('app-root');
  if (root)
    root.textContent =
      'Le programme est momentanément indisponible. Veuillez réessayer dans quelques instants.';
});
