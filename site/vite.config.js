import { defineConfig } from 'vite';
import { cloudflare } from '@cloudflare/vite-plugin';
import { resolve, relative } from 'node:path';
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
const include = html => html.replace(/<!--shell:([a-z]+)-->/g, (_, name) => readFileSync(page(`src/shell/${name}.html`), 'utf8'));

// What search engines and link previews read, written once for every page from the page's own <title> and
// description: the canonical address, the Open Graph and Twitter card (one share image, public/og.jpg, made by
// tools/og.html), and on the home page who he is as schema.org data. public/sitemap.xml lists the same addresses.
const SITE = 'https://shehrozsajjad.com';
const PERSON = {
  '@context': 'https://schema.org', '@type': 'Person', name: 'Shehroz Sajjad', url: `${SITE}/`, image: `${SITE}/og.jpg`,
  jobTitle: 'Founding engineer', worksFor: {'@type': 'Organization', name: 'Beyond Presence'},
  address: {'@type': 'PostalAddress', addressLocality: 'Munich', addressCountry: 'DE'},
  sameAs: ['https://www.linkedin.com/in/mshehrozsajjad/', 'https://github.com/mshehrozsajjad', 'https://www.instagram.com/mshehroz.sajjad/',
    'https://www.tiktok.com/@mshehrozsajjad', 'https://substack.com/@mshehrozsajjad'],
};
// the arriving half of the turn between pages (pages.js starts it, shell.css draws it): the page begins under a sheet
// of the colour the last page left behind
const TURNED = `<script>try{var c=sessionStorage.getItem('turn');if(c){sessionStorage.removeItem('turn');document.documentElement.style.setProperty('--turn',c);document.documentElement.classList.add('turned')}}catch(e){}</script>`;
function seo(html, path) {
  const pick = re => (html.match(re) || [])[1] || '';
  const title = pick(/<title>([^<]*)<\/title>/), about = pick(/<meta name="description" content="([^"]*)">/);
  const where = path.replace(/index\.html$/, '').replace(/\/?$/, '/'), url = SITE + where;
  const tags = [
    `<link rel="canonical" href="${url}">`,
    '<meta property="og:type" content="website">',
    '<meta property="og:site_name" content="Shehroz Sajjad">',
    `<meta property="og:title" content="${title}">`,
    `<meta property="og:description" content="${about}">`,
    `<meta property="og:url" content="${url}">`,
    `<meta property="og:image" content="${SITE}/og.jpg">`,
    '<meta property="og:image:width" content="1200">',
    '<meta property="og:image:height" content="630">',
    '<meta property="og:image:alt" content="Shehroz Sajjad in front of the word HELLO. One person, whole product.">',
    '<meta name="twitter:card" content="summary_large_image">',
    '<meta name="theme-color" content="#F8F5EC">',
    where === '/' ? `<script type="application/ld+json">${JSON.stringify(PERSON)}</script>` : '',
    TURNED,
  ].filter(Boolean).join('\n');
  return html.replace('</title>', `</title>\n${tags}`);
}
const shell = {
  name: 'shell-include',
  transformIndexHtml: {
    order: 'pre',
    handler: (html, ctx) => seo(include(html), `/${relative(import.meta.dirname, ctx.filename)}`),   // ctx.path is a disk path on the dev server
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
            'yolk': page('design/yolk/index.html'),
            'npc-filter': page('design/npc-filter/index.html'),
            'myclosr': page('design/myclosr/index.html'),
            'slaptastic': page('design/slaptastic/index.html'),
            ai: page('ai/index.html'),
            hardware: page('hardware/index.html'),
            story: page('story/index.html'),
            tars: page('tars/index.html'),
          },
        },
      },
    },
  },
}));
