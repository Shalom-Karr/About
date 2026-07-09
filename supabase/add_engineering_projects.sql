-- Add the engineering work that was missing from profile_websites.
--
-- The projects grid held mostly client marketing sites and none of the systems work:
-- SK Music, lockguard, kiosk-exit-guard, JtechTools and Shul Widget were all absent.
-- This adds those five.
--
-- Ordering: the homepage renders `ORDER BY sort_order NULLS LAST, created_at DESC`, and
-- these rows are added without a sort_order, so created_at (set explicitly below) decides
-- their order among each other. SK Music is stamped latest and therefore lands first.
--
-- Idempotent: each INSERT is guarded on url, so re-running is a no-op.

-- ── 1. Technologies referenced below (drives the admin panel's dropdown) ──────────
INSERT INTO public.technologies (name)
SELECT t.name
FROM (VALUES
  ('Kotlin'), ('C'), ('Win32'), ('WebView2'),
  ('Discourse'), ('Ember.js'), ('Android'), ('SQLite'), ('Web Workers')
) AS t(name)
WHERE NOT EXISTS (
  SELECT 1 FROM public.technologies e WHERE e.name = t.name
);

-- ── 2. Projects ──────────────────────────────────────────────────────────────────
INSERT INTO public.profile_websites (title, url, description, technologies, created_at)
SELECT p.title, p.url, p.description, p.technologies, p.created_at
FROM (VALUES
  (
    'SK Music',
    'https://skmusic.shalomkarr.workers.dev/',
    'A filtered music client for the Orthodox Jewish community — every artist in the catalog is vetted by hand, so the app is safe by construction rather than by runtime filter. It runs entirely on Cloudflare Workers static assets: a build-time pipeline bakes a SQLite catalog into a compressed search index, per-entity JSON, and chunked sitemaps, while a thin Worker handles the few things that cannot be static (live playlist contents, Open Graph injection for shared deep links, trending analytics). Search runs fully in the browser on a hand-built dual inverted index — Hebrew-aware consonant-skeleton normalization, IDF weighting, bigram candidate indexing and Damerau fuzzy matching — off the main thread in a Web Worker, with no search backend to operate.',
    ARRAY['Cloudflare Workers','Vanilla JS','Supabase','Service Workers','SQLite','Web Workers'],
    NOW()
  ),
  (
    'lockguard',
    'https://github.com/Shalom-Karr/lockguard',
    'Kernel-mode lockdown for Windows 11 focus machines. A Windows Filtering Platform firewall enforced at the driver layer, a Word-only application allowlist, and a Go watchdog and CLI supervising it. Written to resist a tech-savvy administrator rather than merely inconvenience one.',
    ARRAY['C','Go','Win32'],
    NOW() - INTERVAL '1 minute'
  ),
  (
    'kiosk-exit-guard',
    'https://github.com/Shalom-Karr/kiosk-exit-guard',
    'A 7.9 MB single executable that turns a Windows machine into a locked kiosk: a WebView2 window, a low-level keyboard hook with password-gated re-injection, an HKLM bcrypt password store, a default-deny outbound allowlist firewall, a SHA-256-verified atomic self-updater, and a Windows Service supervisor. Absorbed the former Windows-Filter project.',
    ARRAY['Go','Win32','WebView2'],
    NOW() - INTERVAL '2 minutes'
  ),
  (
    'JtechTools',
    'https://github.com/JTech-Forums/JtechTools',
    'The Discourse plugin bundle powering forums.jtechforums.org — production Ruby running in front of a real community of thousands. Ships dislike, SMTP, mini-mod, mod-categories and dumbcourse as one installable bundle behind six admin tabs.',
    ARRAY['Ruby','Discourse','Ember.js'],
    NOW() - INTERVAL '3 minutes'
  ),
  (
    'Shul Widget',
    'https://github.com/Shalom-Karr/Shul-Widget-Published-App',
    'An Android home-screen widget that pulls live davening times from a shul''s Luach feed. Written in Kotlin and distributed as a standalone app, in use at multiple synagogues already running Luach.',
    ARRAY['Kotlin','Android'],
    NOW() - INTERVAL '5 minutes'
  )
) AS p(title, url, description, technologies, created_at)
WHERE NOT EXISTS (
  SELECT 1 FROM public.profile_websites e WHERE e.url = p.url
);

-- ── 3. Verify ────────────────────────────────────────────────────────────────────
-- Expect SK Music first.
--   SELECT title, url FROM public.profile_websites ORDER BY created_at DESC LIMIT 10;
