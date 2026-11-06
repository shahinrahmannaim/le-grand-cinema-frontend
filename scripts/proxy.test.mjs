import { test } from 'node:test';
import assert from 'node:assert/strict';
import { onRequest } from '../functions/api/[[path]].js';
test('rejects missing or non-HTTPS upstream configuration', async () => {
  for (const origin of [
    undefined,
    'http://backend.test',
    'https://backend.test/api',
    'https://user:secret@backend.test',
  ]) {
    const response = await onRequest({
      request: new Request('https://cinema.test/api/auth/me'),
      env: { BACKEND_ORIGIN: origin },
    });
    assert.equal(response.status, 503);
  }
});
test('preserves cookie, CSRF, query and a streaming response without redirecting the browser', async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async (url, options) => {
    assert.equal(url.href, 'https://backend.test/api/reservations?check=1');
    assert.equal(options.method, 'POST');
    assert.deepEqual(await new Response(options.body).json(), { seats: ['seat-a'] });
    assert.equal(options.headers.get('Cookie'), 'CINEMA_SESSION=opaque');
    assert.equal(options.headers.get('X-CSRF-TOKEN'), 'masked');
    assert.equal(options.headers.get('Host'), null);
    assert.equal(options.redirect, 'manual');
    return new Response('event: refresh\ndata: updated\n\n', {
      headers: {
        'Content-Type': 'text/event-stream',
        'Set-Cookie': 'CINEMA_SESSION=new; Path=/api; Secure; HttpOnly; SameSite=Lax',
      },
    });
  };
  try {
    const response = await onRequest({
      request: new Request('https://cinema.test/api/reservations?check=1', {
        method: 'POST',
        body: JSON.stringify({ seats: ['seat-a'] }),
        headers: { Cookie: 'CINEMA_SESSION=opaque', 'X-CSRF-TOKEN': 'masked' },
      }),
      env: { BACKEND_ORIGIN: 'https://backend.test' },
    });
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('Cache-Control'), 'no-store');
    assert.match(response.headers.get('Set-Cookie'), /HttpOnly/);
    assert.match(await response.text(), /event: refresh/);
  } finally {
    globalThis.fetch = original;
  }
});
test('returns a retryable error when the upstream is unavailable', async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () => {
    throw new Error('Network');
  };
  try {
    assert.equal(
      (
        await onRequest({
          request: new Request('https://cinema.test/api/auth/me'),
          env: { BACKEND_ORIGIN: 'https://backend.test' },
        })
      ).status,
      502,
    );
  } finally {
    globalThis.fetch = original;
  }
});
