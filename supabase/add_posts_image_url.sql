-- Add the missing posts.image_url column.
--
-- Symptom this fixes: saving a post in the blog admin fails with
--   Could not find the 'image_url' column of 'posts' in the schema cache
--   (PostgREST 42703: column posts.image_url does not exist)
--
-- Cause: the blog admin writes image_url on save (blog/admin/index.html), post.html
-- uses it for og:image, and the article JSON-LD references it — but the column was
-- never actually created on the live table. schema.sql defines it and
-- add_post_seo_columns.sql assumed it was "already on the posts table," yet the live
-- posts table has never had it. This adds it for real.

ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Force PostgREST to reload its schema cache so the admin works immediately, rather
-- than after the next automatic reload.
NOTIFY pgrst, 'reload schema';

-- Verify:
--   SELECT column_name FROM information_schema.columns
--   WHERE table_schema = 'public' AND table_name = 'posts' AND column_name = 'image_url';
