import type { APIRoute } from 'astro'

// Dynamic rather than a static public/robots.txt file, so the Sitemap line
// always matches the same `site` config the sitemap integration itself
// uses (astro.config.mjs) — one source of truth, not two domains to keep
// in sync.
export const GET: APIRoute = ({ site }) => {
  const sitemapUrl = new URL('sitemap-index.xml', site).toString()
  return new Response(`User-agent: *\nAllow: /\n\nSitemap: ${sitemapUrl}\n`, {
    headers: { 'Content-Type': 'text/plain' },
  })
}
