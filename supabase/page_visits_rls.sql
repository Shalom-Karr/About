-- Allow anonymous visitors to record a page visit; restrict reads to signed-in admins.
--
-- Symptom this fixes: every visit insert from tracker.js fails in the browser console with
--
--   POST /rest/v1/page_visits 401 (Unauthorized)
--   Tracker Error: { code: '42501',
--                    message: 'new row violates row-level security policy for table "page_visits"' }
--
-- Cause: RLS is enabled on public.page_visits but no policy grants INSERT to the `anon`
-- role. Postgres therefore denies every write from the public site. The table was created
-- in schema.sql without any policies, and RLS was turned on afterwards in the dashboard —
-- so the repo never described the state the live database is actually in.
--
-- Note the asymmetry: `anon` may INSERT but may not SELECT. Visitors write their own row
-- and cannot read anyone else's. The admin analytics dashboard (admin.js) reads this table
-- while signed in, so SELECT is granted to `authenticated` only.

-- Make sure RLS is on (no-op if already enabled).
ALTER TABLE public.page_visits ENABLE ROW LEVEL SECURITY;

-- Insert: the public site's tracker.js, running as `anon`.
DROP POLICY IF EXISTS "anon insert page_visits" ON public.page_visits;
CREATE POLICY "anon insert page_visits"
  ON public.page_visits
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Read: admin analytics dashboard only. Deliberately NOT granted to `anon`, since these
-- rows contain visitor IP addresses.
DROP POLICY IF EXISTS "auth read page_visits" ON public.page_visits;
CREATE POLICY "auth read page_visits"
  ON public.page_visits
  FOR SELECT
  TO authenticated
  USING (true);

-- Delete: let a signed-in admin prune old rows. No UPDATE policy — a visit is immutable.
DROP POLICY IF EXISTS "auth delete page_visits" ON public.page_visits;
CREATE POLICY "auth delete page_visits"
  ON public.page_visits
  FOR DELETE
  TO authenticated
  USING (true);
