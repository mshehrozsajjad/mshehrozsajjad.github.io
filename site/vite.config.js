import { defineConfig } from 'vite';
import { cloudflare } from '@cloudflare/vite-plugin';
import { resolve } from 'node:path';
import { readFileSync, writeFileSync } from 'node:fs';

// one page per audience: the pitch at /, a page per kind of work, and the long story kept at /story.
// The pages belong to the client build only; the worker keeps its own entry.
const page = p => resolve(import.meta.dirname, p);

// Doodle mode (src/doodle-editor.js) saves his strokes through here while the dev server runs; the live site only
// reads public/doodles.json. The dev server can be open to the local network (--host, for drawing on the iPad),
// so only well-formed strokes are written.
const DOODLES = page('public/doodles.json');
const isStroke = s => s && typeof s.a === 'string' && s.a.length < 80 && typeof s.d === 'string' && /^[MLQ0-9 .-]+$/.test(s.d)
  && Number.isFinite(s.w) && ['signal', 'ink', 'pencil'].includes(s.c);
const isPageSave = d => d && /^\/[a-z-]*$/.test(d.page) && Array.isArray(d.strokes) && d.strokes.every(isStroke);
const readDoodles = () => { try { return JSON.parse(readFileSync(DOODLES, 'utf8')); } catch (_) { return {}; } };
const doodleSaver = {
  name: 'doodle-saver',
  apply: 'serve',
  configureServer(server) {
    server.watcher.unwatch(DOODLES);   // saving must not reload the page he is drawing on
    server.middlewares.use('/__doodles', (req, res) => {
      if (req.method !== 'POST') { res.statusCode = 405; return res.end(); }
      let body = '';
      req.on('data', chunk => { body += chunk; if (body.length > 2e6) req.destroy(); });
      req.on('end', () => {
        try {
          const save = JSON.parse(body);
          if (!isPageSave(save)) throw new Error('not a page of doodles');
          const all = readDoodles();   // one page at a time, so a tab on one page never overwrites another page
          all[save.page] = save.strokes;
          writeFileSync(DOODLES, JSON.stringify(all, null, 1) + '\n');
          res.end('ok');
        } catch (e) {
          res.statusCode = 400;
          res.end(e.message);
        }
      });
    });
  },
};
// The shell every page shares (header, menu, twin, footer) lives once in src/shell/*.html; a page asks for a piece with
// <!--shell:name-->. Done before Vite reads the page, so the pieces' assets are handled like the page's own.
const shell = {
  name: 'shell-include',
  transformIndexHtml: {
    order: 'pre',
    handler: html => html.replace(/<!--shell:([a-z]+)-->/g, (_, name) => readFileSync(page(`src/shell/${name}.html`), 'utf8')),
  },
};
export default defineConfig(({command}) => ({
  // a build re-bundles the dependencies too; in the dev server's cache that leaves an open page asking for files that
  // just changed under it ("504 Outdated Optimize Dep"), so builds keep their own cache
  cacheDir: command === 'build' ? 'node_modules/.vite-build' : 'node_modules/.vite',
  plugins: [shell, doodleSaver, cloudflare()],
  build: {
    assetsDir: 'bundle',
  },
  environments: {
    client: {
      build: {
        rollupOptions: {
          input: {
            home: page('index.html'),
            code: page('code/index.html'),
            design: page('design/index.html'),
            ai: page('ai/index.html'),
            hardware: page('hardware/index.html'),
            story: page('story/index.html'),
          },
        },
      },
    },
  },
}));
