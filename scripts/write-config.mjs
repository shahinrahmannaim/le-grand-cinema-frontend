import { writeFileSync, mkdirSync } from 'node:fs';
const apiBaseUrl = (process.env.API_BASE_URL || '/api').replace(/\/$/, '');
if (apiBaseUrl !== '/api' && !/^https:\/\/[^\s]+\/api$/.test(apiBaseUrl)) {
  throw new Error('API_BASE_URL must be /api or an HTTPS URL ending with /api.');
}
mkdirSync('public', { recursive: true });
writeFileSync('public/config.json', JSON.stringify({ apiBaseUrl }) + '\n');
