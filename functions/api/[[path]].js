/** Fixed upstream API proxy: keeps session cookies first-party while both apps deploy independently. */
export async function onRequest({ request, env }) {
  let upstream;
  try {
    upstream = new URL(env.BACKEND_ORIGIN);
    if (
      upstream.protocol !== 'https:' ||
      upstream.username ||
      upstream.password ||
      upstream.pathname !== '/' ||
      upstream.search ||
      upstream.hash
    )
      throw new Error('Invalid origin');
  } catch {
    return Response.json(
      { detail: 'Le serveur cinéma n’est pas configuré.' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    );
  }
  const incoming = new URL(request.url);
  upstream.pathname = incoming.pathname;
  upstream.search = incoming.search;
  const headers = new Headers(request.headers);
  headers.delete('host');
  headers.delete('forwarded');
  headers.delete('x-forwarded-for');
  headers.delete('x-forwarded-host');
  headers.delete('x-forwarded-proto');
  try {
    const response = await fetch(upstream, {
      method: request.method,
      headers,
      body: ['GET', 'HEAD'].includes(request.method) ? undefined : request.body,
      redirect: 'manual',
    });
    const result = new Response(response.body, response);
    result.headers.set('Cache-Control', 'no-store');
    result.headers.set('X-Content-Type-Options', 'nosniff');
    return result;
  } catch {
    return Response.json(
      { detail: 'Le serveur cinéma redémarre. Réessayez dans un instant.' },
      { status: 502, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
