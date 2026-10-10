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
    // Do not proxy any request to the live SIMANTAB application.
    return env.ASSETS.fetch(request);
  }
};
