// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  // Sitemap URLs must be absolute, so this needs a real domain — this repo
  // is a template with none of its own. Astro evaluates this file before
  // loading .env files, so this only sees a real value from an actual
  // shell/CI env var (e.g. `SITE_URL=https://x.com pnpm build`) — which is
  // exactly how Vercel injects env vars anyway, so that's not a real gap
  // for the deployment target this matters for. The placeholder below is
  // intentionally obviously wrong.
  site: process.env.SITE_URL || 'https://example.com',
  integrations: [sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
});
