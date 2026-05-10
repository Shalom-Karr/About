// Cloudflare Pages Function: dynamic sitemap.xml.
//
// Queries Supabase for every published blog post and emits one <url>
// per post plus the static homepage / blog / contact / about entries.
// Replaces the hand-maintained sitemap.xml so adding a post only
// requires publishing it in the admin — no sitemap edit needed.
//
// SUPABASE_URL and SUPABASE_ANON_KEY must be set as environment
// variables on the Cloudflare Pages project (same vars used by the
// build step for js/supabase-client.js).

function xmlEscape(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function onRequest(context) {
  const url    = new URL(context.request.url);
  const origin = url.origin;
  const today  = new Date().toISOString().slice(0, 10);

  const supaUrl = context.env.SUPABASE_URL;
  const supaKey = context.env.SUPABASE_ANON_KEY;

  // Fetch published posts (slug + updated_at) from Supabase REST.
  let posts = [];
  if (supaUrl && supaKey) {
    try {
      const r = await fetch(
        `${supaUrl}/rest/v1/posts` +
        `?select=slug,created_at&is_published=eq.true&order=created_at.desc`,
        { headers: { apikey: supaKey, Authorization: `Bearer ${supaKey}` } }
      );
      if (r.ok) posts = await r.json();
    } catch (e) {
      // Fall through with empty list — sitemap still serves static URLs.
    }
  }

  const entries = [
    { loc: `${origin}/`,              lastmod: today, changefreq: 'monthly', priority: '1.0' },
    { loc: `${origin}/blog/`,         lastmod: today, changefreq: 'daily',   priority: '0.9' },
    { loc: `${origin}/blog/about/`,   lastmod: today, changefreq: 'monthly', priority: '0.7' },
    { loc: `${origin}/blog/contact/`, lastmod: today, changefreq: 'monthly', priority: '0.7' },
    ...posts.map(p => ({
      loc: `${origin}/blog/post/${encodeURIComponent(p.slug)}`,
      lastmod: (p.created_at || today + 'T00:00:00Z').slice(0, 10),
      changefreq: 'monthly',
      priority: '0.8',
    })),
  ];

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.map(e => `  <url>
    <loc>${xmlEscape(e.loc)}</loc>
    <lastmod>${e.lastmod}</lastmod>
    <changefreq>${e.changefreq}</changefreq>
    <priority>${e.priority}</priority>
  </url>`).join('\n')}
</urlset>
`;

  return new Response(body, {
    headers: {
      'Content-Type':  'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=300, s-maxage=300',
    },
  });
}
