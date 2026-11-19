import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync('dist/cinema-frontend/browser/index.html', 'utf8');
const links = html.match(/<link\b[^>]*>/gi) ?? [];
const stylesheet = links.find((link) => /rel=["']stylesheet["']/i.test(link));

assert.ok(stylesheet, 'Missing global stylesheet.');
assert.doesNotMatch(stylesheet, /media=["']print["']/i);
assert.doesNotMatch(html, /data-beasties-media/);

console.log('PASS: production CSS loads without an inline activation script.');
