// Cloudflare Pages Function: serve /blog/post.html at /blog/post/<slug>
// while keeping the clean URL in the address bar (no redirect).
//
// We fetch /blog/post (the .html-stripped canonical path) instead of
// /blog/post.html — fetching the .html form triggers CF's auto-redirect
// to the stripped form, which would propagate back to the user as a
// 308 to /blog/post?slug=<slug>. Fetching /blog/post directly returns
// the HTML body with no redirect, so the browser stays on
// /blog/post/<slug>.
//
// post.html's inline SEO bootstrap reads the slug from the path
// (/blog/post/<slug>), so the title query param isn't strictly
// needed on the rewritten fetch — but we pass it anyway as a
// fallback for any code that still reads from URLSearchParams.

export async function onRequest(context) {
  const url  = new URL(context.request.url);
  const slug = context.params.slug;

  const target = new URL('/blog/post', url.origin);
  target.searchParams.set('slug', slug);
  for (const [k, v] of url.searchParams) {
    if (k !== 'slug') target.searchParams.set(k, v);
  }

  const response = await context.env.ASSETS.fetch(
    new Request(target.toString(), context.request)
  );
  if (response.status >= 300 && response.status < 400) {
    return new Response('Not found', { status: 404 });
  }
  return response;
}
