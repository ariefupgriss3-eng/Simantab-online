// SIMANTAB Cloudflare staging: no data access, AI billing, or production effects.
function json(status,payload) {
  return new Response(JSON.stringify(payload),{
    status,
    headers:{
      'Content-Type':'application/json; charset=utf-8',
      'Cache-Control':'no-store',
      'X-Content-Type-Options':'nosniff'
    }
  });
}
export default {
  async fetch(request,env) {
    const url = new URL(request.url);
    if(url.pathname==='/api/staging-health') {
      return json(200,{
        status:'staging-only',
        backend:'not-migrated',
        productionDataConnected:false,
        aiGatewayConnected:false
      });
    }
    if(url.pathname.startsWith('/api/')) {
      return json(503,{
        error:'SIMANTAB staging: layanan API belum aktif. Gunakan SIMANTAB produksi untuk layanan kedinasan.'
      });
    }
    // Staging must remain incapable of authenticating against production Supabase.
    // Even if the real HTML snapshot is accidentally served, disable its scripts,
    // network requests and form submissions until a separate test backend exists.
    const asset=await env.ASSETS.fetch(request);
    const headers=new Headers(asset.headers);
    headers.set('Content-Security-Policy',
      "default-src 'none'; script-src 'none'; connect-src 'none'; form-action 'none'; "+
      "img-src 'self' data:; style-src 'self' 'unsafe-inline'; font-src 'self'; "+
      "frame-ancestors 'none'; object-src 'none'; base-uri 'none'");
    headers.set('Cache-Control','no-store');
    headers.set('Referrer-Policy','no-referrer');
    headers.set('X-Content-Type-Options','nosniff');
    headers.set('X-Frame-Options','DENY');
    headers.set('X-SIMANTAB-Environment','cloudflare-staging-no-auth');
    return new Response(asset.body,{status:asset.status,statusText:asset.statusText,headers});
  }
};
