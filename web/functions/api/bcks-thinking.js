// Cloudflare Pages compatibility adapter for legacy Node-compatible AI Coach handler.
// Keeps authentication, validation, and model logic in one canonical implementation.
import legacyHandler from '../../api/bcks-thinking.js';

export async function onRequest(context) {
  const request = context.request;
  if (request.method !== 'POST') {
    return Response.json({error: 'Method not allowed'}, {status: 405, headers: {'Cache-Control':'no-store'}});
  }
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return Response.json({error: 'JSON payload required'}, {status: 400, headers: {'Cache-Control':'no-store'}});
  }
  const headers = {};
  for (const [key, value] of request.headers.entries()) headers[key.toLowerCase()] = value;
  let responseBody = null;
  const responseHeaders = new Headers({'Cache-Control':'no-store'});
  const response = {
    statusCode: 200,
    setHeader(name, value) { responseHeaders.set(name, value); },
    end(content) { responseBody = String(content ?? ''); }
  };
  try {
    await legacyHandler({method: request.method, headers, body}, response);
    if (responseBody === null) return Response.json({error:'No response from AI Coach'}, {status:502});
    return new Response(responseBody, {status: response.statusCode || 200, headers: responseHeaders});
  } catch (error) {
    console.error('BCKS_CF_ADAPTER_ERROR', error?.message || String(error));
    return Response.json({error: 'Layanan AI Coach belum tersedia.'}, {status:502, headers:{'Cache-Control':'no-store'}});
  }
}
