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
/* /api/twin: starts a live call with Shehroz's AI twin (a Beyond Presence managed agent).
   The browser never sees the API key: the worker asks Beyond Presence for a LiveKit room and hands back only the room's
   address and a join token. Basic protection against bots: the request has to come from this site, and each visitor can
   start CALLS calls (each one a billed session) in any WINDOW seconds, so hanging up and calling straight back works,
   but a script can't run up the bill. Settings: BEY_API_KEY (secret), BEY_AGENT_ID and BEY_API_URL (wrangler.jsonc). */
const CALLS = 4, WINDOW = 600;
const BEY_ERRORS = {402: 'unavailable', 429: 'busy'};   // plan limit reached, too many calls at once
async function twin(request, env){
  if (request.method !== 'POST') return Response.json({error: 'method'}, {status: 405});
  const origin = request.headers.get('origin');
  if (!origin || new URL(origin).host !== new URL(request.url).host) return Response.json({error: 'forbidden'}, {status: 403});
  if (!env.BEY_API_KEY || !env.BEY_AGENT_ID) return Response.json({error: 'unavailable'}, {status: 503});

  // this visitor's calls in the current window: {n, start}
  const cache = caches.default, key = new Request(`https://cache.internal/twin/${encodeURIComponent(request.headers.get('cf-connecting-ip') || 'local')}`);
  const now = Date.now();
  let tally = await (await cache.match(key))?.json().catch(() => null);
  if (!tally || now - tally.start >= WINDOW * 1000) tally = {n: 0, start: now};
  if (tally.n >= CALLS) return Response.json({error: 'wait', retry: Math.ceil((tally.start + WINDOW * 1000 - now) / 1000)}, {status: 429});

  let res;
  try {
    res = await fetch(`${env.BEY_API_URL || 'https://api.bey.dev'}/v1/livekit-rooms`, {
      method: 'POST',
      headers: {'x-api-key': env.BEY_API_KEY, 'content-type': 'application/json'},
      body: JSON.stringify({agent_id: env.BEY_AGENT_ID, tags: {source: 'website'}}),
    });
  } catch (e) {
    console.error('twin: Beyond Presence unreachable', e.message);
    return Response.json({error: 'error'}, {status: 502});
  }
  if (!res.ok){
    console.error('twin: Beyond Presence said', res.status, await res.text());   // the key is never in its reply
    return Response.json({error: BEY_ERRORS[res.status] || 'error'}, {status: 502});
  }
  const room = await res.json();
  tally.n += 1;   // counted only once a call was really made
  const left = Math.ceil((tally.start + WINDOW * 1000 - now) / 1000);
  await cache.put(key, Response.json(tally, {headers: {'cache-control': `max-age=${left}`}}));
  return Response.json({url: room.livekit_url, token: room.livekit_token}, {headers: {'cache-control': 'no-store'}});
}

export default {
  async fetch(request, env, ctx){
    const url = new URL(request.url);
    if (url.pathname === '/api/contributions') return contributions(ctx);
    if (url.pathname === '/api/twin') return twin(request, env);
    return Response.json({error: 'Not found'}, {status: 404});
  },
};
