-- Invite accept/decline: default is 'accepted', not 'pending' -- existing
-- rows are already-established access grants from before this feature
-- existed and must not be silently downgraded to a non-access-granting
-- state. New invites explicitly set status='pending' in the application
-- code; they don't rely on this column default.
ALTER TABLE public.project_members
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'accepted'
  CHECK (status IN ('pending', 'accepted'));
