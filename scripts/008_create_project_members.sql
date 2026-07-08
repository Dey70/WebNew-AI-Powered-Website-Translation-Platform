-- V4.0: shared project access. A row's existence IS "member" -- ownership
-- stays projects.owner_id, this table only ever adds non-owner collaborators.
CREATE TABLE IF NOT EXISTS public.project_members (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (project_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_project_members_project_id ON public.project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_user_id ON public.project_members(user_id);

ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;

-- Backstop only, same as profiles/projects -- the service-role client every
-- route uses bypasses RLS; app-level access checks are the real boundary.
CREATE POLICY "Members can view their project's membership"
  ON public.project_members FOR SELECT
  USING (
    auth.uid() = user_id
    OR project_id IN (SELECT id FROM public.projects WHERE owner_id = auth.uid())
  );
