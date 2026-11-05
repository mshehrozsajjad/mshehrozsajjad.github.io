// wrangler.jsonc routes only /api/* here (assets.run_worker_first); everything else is served as a static asset.
export default {
  async fetch() {
    return Response.json({ error: 'Not found' }, { status: 404 });
  },
};
