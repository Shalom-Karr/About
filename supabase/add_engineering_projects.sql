

-- ── 2. Projects ──────────────────────────────────────────────────────────────────
INSERT INTO public.profile_websites (title, url, description, technologies, created_at)
SELECT p.title, p.url, p.description, p.technologies, p.created_at
FROM (VALUES
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
