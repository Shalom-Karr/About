-- Add image_url column to posts table.
-- This column stores an optional cover/thumbnail image URL for blog posts.

ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS image_url TEXT NULL;
