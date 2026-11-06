// wrangler.jsonc routes only /api/* here (assets.run_worker_first); everything else is served as a static asset.
// /api/contributions: Shehroz's public GitHub contribution calendar, read from his public profile and cached for six hours.
// No token: it is the same calendar anyone sees on github.com. If GitHub can't be reached the page falls back to /data/contributions.json.
const USER = 'mshehrozsajjad';
async function contributions(ctx){
  const cache = caches.default, key = new Request('https://cache.internal/contributions');
  const hit = await cache.match(key); if (hit) return hit;
  const res = await fetch(`https://github.com/users/${USER}/contributions`, {headers: {'user-agent': 'shehrozsajjad.com'}});
  if (!res.ok) return Response.json({error: 'github unavailable'}, {status: 502});
  const html = await res.text();
  // each day is a <td data-date> with an id; its count is in the <tool-tip for=id> that follows
  const ids = {}; for (const m of html.matchAll(/<td[^>]*data-date="(\d{4}-\d\d-\d\d)"[^>]*id="([^"]+)"/g)) ids[m[2]] = m[1];
  for (const m of html.matchAll(/<td[^>]*id="([^"]+)"[^>]*data-date="(\d{4}-\d\d-\d\d)"/g)) ids[m[1]] = m[2];
  const byDate = {};
  for (const m of html.matchAll(/<tool-tip[^>]*for="([^"]+)"[^>]*>([^<]*)</g)){
    const d = ids[m[1]]; if (!d) continue;
    const n = m[2].match(/^(\d[\d,]*|No) contribution/); byDate[d] = n ? (n[1] === 'No' ? 0 : +n[1].replace(/,/g, '')) : 0;
  }
  const dates = Object.keys(byDate).sort();
  if (!dates.length) return Response.json({error: 'could not read the calendar'}, {status: 502});
  const counts = dates.map(d => byDate[d]);
  const out = Response.json({user: USER, start: dates[0], counts, total: counts.reduce((a, b) => a + b, 0)}, {headers: {'cache-control': 'public, max-age=21600'}});
  ctx.waitUntil(cache.put(key, out.clone()));
  return out;
}
export default {
  async fetch(request, env, ctx){
    const url = new URL(request.url);
    if (url.pathname === '/api/contributions') return contributions(ctx);
    return Response.json({error: 'Not found'}, {status: 404});
  },
};
