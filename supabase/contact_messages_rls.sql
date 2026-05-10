-- Allow signed-in admins to read / update / delete contact_messages.
--
-- Symptom this fixes: clicking "Mark Read" or "Mark All Read" in the
-- inbox visually flips the badge but the change doesn't persist —
-- on refresh the message comes back as unread. Cause: RLS on
-- contact_messages allows anonymous INSERT (so the public contact
-- form can write) but does not allow authenticated UPDATE / DELETE,
-- so PostgREST silently affects 0 rows when admin clicks the button.
--
-- This migration adds permissive policies for any signed-in user.
-- If you want to lock it down to a specific email or admin role,
-- replace the USING (true) clauses with a stricter check.

-- Make sure RLS is on (no-op if already enabled).
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Read
DROP POLICY IF EXISTS "auth read contact_messages" ON public.contact_messages;
CREATE POLICY "auth read contact_messages"
  ON public.contact_messages
  FOR SELECT
  TO authenticated
  USING (true);

-- Update (mark read / unread)
DROP POLICY IF EXISTS "auth update contact_messages" ON public.contact_messages;
CREATE POLICY "auth update contact_messages"
  ON public.contact_messages
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Delete
DROP POLICY IF EXISTS "auth delete contact_messages" ON public.contact_messages;
CREATE POLICY "auth delete contact_messages"
  ON public.contact_messages
  FOR DELETE
  TO authenticated
  USING (true);
