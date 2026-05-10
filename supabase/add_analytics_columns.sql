-- Richer analytics columns + extended views (additive, idempotent).
--
-- Adds session_id and device_type to blog_post_views so the admin
-- dashboard can show unique-session counts and device breakdowns.
-- Existing views are extended (not dropped) so nothing that depends
-- on the current column order or names breaks.
--
-- CREATE OR REPLACE VIEW only allows APPENDING columns. Postgres
-- will reject any reordering or renaming. The new aggregations are
-- therefore tacked onto the end of each view.

-- 1. New columns on blog_post_views
ALTER TABLE public.blog_post_views
  ADD COLUMN IF NOT EXISTS session_id  text,
  ADD COLUMN IF NOT EXISTS device_type text;

CREATE INDEX IF NOT EXISTS idx_blog_post_views_session_id
  ON public.blog_post_views (session_id);
CREATE INDEX IF NOT EXISTS idx_blog_post_views_device_type
  ON public.blog_post_views (device_type);

-- 2. Extend blog_post_analytics — keep every existing column in the
--    same position, append new ones at the end.
CREATE OR REPLACE VIEW public.blog_post_analytics AS
SELECT
  p.id,
  p.slug,
  p.title,
  p.created_at,
  COUNT(DISTINCT l.id)                                                       AS likes_count,
  COUNT(DISTINCT v.id)                                                       AS total_views,
  COUNT(DISTINCT v.fingerprint)                                              AS unique_visitors,
  AVG(v.view_duration_seconds)::int                                          AS avg_duration_seconds,
  AVG(v.scroll_depth_percent)::int                                           AS avg_scroll_depth_percent,
  MAX(v.created_at)                                                          AS last_viewed_at,
  COUNT(DISTINCT c.id)                                                       AS total_clicks,
  COUNT(DISTINCT CASE WHEN c.click_type = 'external_link' THEN c.id END)     AS external_link_clicks,
  COUNT(DISTINCT CASE WHEN c.click_type = 'tag'           THEN c.id END)     AS tag_clicks,
  COUNT(DISTINCT CASE WHEN c.click_type = 'share'         THEN c.id END)     AS share_clicks,
  CASE WHEN COUNT(DISTINCT v.id) > 0
       THEN (COUNT(DISTINCT c.id)::float / COUNT(DISTINCT v.id)::float)::numeric(5,2)
       ELSE 0
  END                                                                        AS clicks_per_view,
  CASE WHEN COUNT(DISTINCT v.id) > 0
       THEN (COUNT(DISTINCT l.id)::float / COUNT(DISTINCT v.id)::float * 100)::numeric(5,2)
       ELSE 0
  END                                                                        AS like_rate_percent,
  -- New columns appended at the end:
  COUNT(DISTINCT v.session_id)                                               AS unique_sessions,
  p.is_published                                                             AS is_published
FROM public.posts p
LEFT JOIN public.blog_post_views  v ON p.id = v.post_id
LEFT JOIN public.blog_post_clicks c ON p.id = c.post_id
LEFT JOIN public.post_likes       l ON p.id = l.post_id
WHERE p.is_published = true
GROUP BY p.id, p.slug, p.title, p.created_at, p.is_published;

-- 3. Extend blog_post_analytics_by_date — append unique_sessions_count
--    at the end so the existing column order is preserved.
CREATE OR REPLACE VIEW public.blog_post_analytics_by_date AS
SELECT
  p.id   AS post_id,
  p.slug,
  p.title,
  DATE(v.created_at)                       AS view_date,
  COUNT(DISTINCT v.id)                     AS views_count,
  COUNT(DISTINCT v.fingerprint)            AS unique_visitors_count,
  AVG(v.view_duration_seconds)::int        AS avg_duration_seconds,
  COUNT(DISTINCT c.id)                     AS clicks_count,
  -- New column appended at the end:
  COUNT(DISTINCT v.session_id)             AS unique_sessions_count
FROM public.posts p
LEFT JOIN public.blog_post_views  v ON p.id = v.post_id
LEFT JOIN public.blog_post_clicks c ON p.id = c.post_id AND DATE(c.created_at) = DATE(v.created_at)
WHERE p.is_published = true AND v.created_at IS NOT NULL
GROUP BY p.id, p.slug, p.title, DATE(v.created_at)
ORDER BY view_date DESC, views_count DESC;

-- 4. Device breakdown view — fully new, safe to add.
CREATE OR REPLACE VIEW public.blog_post_devices AS
SELECT
  COALESCE(device_type, 'unknown') AS device_type,
  COUNT(*)                         AS view_count,
  COUNT(DISTINCT fingerprint)      AS unique_visitors,
  COUNT(DISTINCT session_id)       AS unique_sessions
FROM public.blog_post_views
GROUP BY COALESCE(device_type, 'unknown')
ORDER BY view_count DESC;
