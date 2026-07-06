-- V2 Milestone 2: projects get a server-generated slug (slugified name, with a
-- short random suffix appended only on collision -- never user-entered), so
-- this is a safety-net constraint, not a UX surface.
ALTER TABLE public.projects
  ADD CONSTRAINT projects_owner_slug_unique UNIQUE (owner_id, slug);
