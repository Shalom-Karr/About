-- Per-post SEO overrides.
--
-- Both columns are nullable. When NULL, blog/post.html falls back to:
--   seo_title       -> "<title> · Shalom Karr"
--   seo_description -> excerpt, then a content snippet
--
-- The admin SEO section in blog/admin/index.html writes these fields.
-- image_url is already on the posts table and is now used as og:image.

ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS seo_title       text,
  ADD COLUMN IF NOT EXISTS seo_description text;
