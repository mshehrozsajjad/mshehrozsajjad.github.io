import { defineConfig } from 'vite';
import { cloudflare } from '@cloudflare/vite-plugin';
import { resolve } from 'node:path';

// one page per audience: the pitch at /, a page per kind of work, and the long story kept at /story.
// The pages belong to the client build only; the worker keeps its own entry.
const page = p => resolve(import.meta.dirname, p);
export default defineConfig({
  plugins: [cloudflare()],
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
});
