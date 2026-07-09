-- Give projects an explicit, admin-controlled display order.
--
-- Until now the homepage rendered profile_websites by created_at, so the only way to
-- change what appeared first was to re-insert a row. This adds a sort_order column the
-- admin panel writes with its drag / move-up-down controls.
--
-- Ordering contract (homepage prerender, client revalidation and admin all agree):
--   ORDER BY sort_order ASC NULLS LAST, created_at DESC
-- so a row with sort_order = 0 leads, unordered rows fall to the back in recency order.

ALTER TABLE public.profile_websites
  ADD COLUMN IF NOT EXISTS sort_order INTEGER;

-- Backfill a stable initial order for existing rows: newest first, matching what the
-- homepage showed before this change, so nothing visibly reorders on first deploy.
WITH ranked AS (
  SELECT id, (row_number() OVER (ORDER BY created_at DESC) - 1) AS n
  FROM public.profile_websites
)
UPDATE public.profile_websites p
SET sort_order = ranked.n
FROM ranked
WHERE ranked.id = p.id
  AND p.sort_order IS NULL;

-- Speeds up the ORDER BY on every homepage build and admin load.
CREATE INDEX IF NOT EXISTS profile_websites_sort_order_idx
  ON public.profile_websites (sort_order NULLS LAST, created_at DESC);

-- Verify:
--   SELECT sort_order, title FROM public.profile_websites
--   ORDER BY sort_order ASC NULLS LAST, created_at DESC;
