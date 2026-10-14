// Cloudflare Pages wrapper for the existing Vercel-Edge-compatible service.
// Workers on compatibility_date 2026-10-14 expose configured secrets via process.env.
import handler from '../../jabfung-ai-read-edge.js';
export const onRequest = ({request}) => handler(request);
