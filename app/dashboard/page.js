"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function DashboardPage() {
  const [projects, setProjects] = useState([]);
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);
  const [respondingTo, setRespondingTo] = useState(null);

  async function loadAll() {
    setLoading(true);
    const [projectsRes, invitesRes] = await Promise.all([fetch("/api/projects"), fetch("/api/invites")]);
    const projectsJson = await projectsRes.json();
    const invitesJson = await invitesRes.json();
    if (projectsJson.success) setProjects(projectsJson.data);
    if (invitesJson.success) setInvites(invitesJson.data);
    setLoading(false);
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    setError(null);
    setCreating(true);

    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const json = await res.json();

    setCreating(false);

    if (!json.success) {
      setError(json.error || "Failed to create project");
      return;
    }

    setName("");
    loadAll();
  }

  async function handleRespond(projectId, accept) {
    setRespondingTo(projectId);
    const res = await fetch(`/api/invites/${projectId}`, { method: accept ? "PATCH" : "DELETE" });
    const json = await res.json();
    setRespondingTo(null);
    if (json.success) loadAll();
  }

  return (
    <div className="mx-auto max-w-3xl">
      {invites.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-medium text-white">Pending invites</h2>
          <ul className="mt-2 divide-y divide-white/10 rounded-xl border border-amber-400/30 bg-amber-400/10 shadow-[0_10px_30px_rgba(0,0,0,0.3)]">
            {invites.map((invite) => (
              <li key={invite.id} className="flex items-center justify-between px-4 py-3">
                <span className="text-sm text-amber-100">
                  <strong>{invite.projectName}</strong> — invited by {invite.ownerEmail || "unknown"}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleRespond(invite.project_id, true)}
                    disabled={respondingTo === invite.project_id}
                    className="rounded bg-brand-cta px-3 py-1.5 text-sm font-medium text-white transition hover:bg-brand-cta-hover disabled:opacity-50"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => handleRespond(invite.project_id, false)}
                    disabled={respondingTo === invite.project_id}
                    className="rounded border border-white/20 px-3 py-1.5 text-sm text-white transition hover:bg-white/10 disabled:opacity-50"
                  >
                    Decline
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <h1 className="text-2xl font-semibold text-white">Projects</h1>
      <p className="mt-1 text-white/60">
        Group your websites into projects. Each project can hold multiple sites.
      </p>

      <form onSubmit={handleCreate} className="mt-6 flex gap-2">
        <input
          type="text"
          required
          placeholder="Project name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="flex-1 rounded border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 outline-none transition focus:border-brand-red-500"
        />
        <button
          type="submit"
          disabled={creating}
          className="rounded bg-brand-cta px-4 py-2 text-sm font-medium text-white shadow-[0_4px_15px_rgba(148,13,13,0.3)] transition hover:bg-brand-cta-hover disabled:opacity-50"
        >
          {creating ? "Creating..." : "New Project"}
        </button>
      </form>
      {error && <p className="mt-2 text-sm text-brand-red-400">{error}</p>}

      <div className="mt-8">
        {loading ? (
          <p className="text-sm text-white/50">Loading...</p>
        ) : projects.length === 0 ? (
          <p className="text-sm text-white/50">
            No projects yet. Create one above to register your first website.
          </p>
        ) : (
          <ul className="divide-y divide-white/10 rounded-xl border border-white/10 bg-white/5 shadow-[0_10px_30px_rgba(0,0,0,0.3)]">
            {projects.map((project) => (
              <li key={project.id}>
                <Link
                  href={`/dashboard/projects/${project.id}`}
                  className="block px-4 py-3 transition hover:bg-white/10"
                >
                  <span className="font-medium text-white">{project.name}</span>
                  <span className="ml-2 text-sm text-white/40">/{project.slug}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
