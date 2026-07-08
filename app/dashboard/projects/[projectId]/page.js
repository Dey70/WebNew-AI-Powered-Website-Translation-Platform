"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

export default function ProjectDetailPage() {
  const { projectId } = useParams();
  const router = useRouter();

  const [project, setProject] = useState(null);
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [siteName, setSiteName] = useState("");
  const [origins, setOrigins] = useState("");
  const [creatingSite, setCreatingSite] = useState(false);
  const [newSiteResult, setNewSiteResult] = useState(null);

  const [members, setMembers] = useState([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState(null);

  async function loadAll() {
    setLoading(true);
    const [projectRes, sitesRes, membersRes] = await Promise.all([
      fetch(`/api/projects/${projectId}`),
      fetch(`/api/sites?projectId=${projectId}`),
      fetch(`/api/projects/${projectId}/members`),
    ]);
    const projectJson = await projectRes.json();
    const sitesJson = await sitesRes.json();
    const membersJson = await membersRes.json();

    if (projectJson.success) setProject(projectJson.data);
    if (sitesJson.success) setSites(sitesJson.data);
    if (membersJson.success) setMembers(membersJson.data);
    setLoading(false);
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  async function handleCreateSite(e) {
    e.preventDefault();
    setError(null);
    setCreatingSite(true);
    setNewSiteResult(null);

    const allowedOrigins = origins
      .split(",")
      .map((o) => o.trim())
      .filter(Boolean);

    const res = await fetch("/api/sites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: siteName, projectId, allowedOrigins }),
    });
    const json = await res.json();

    setCreatingSite(false);

    if (!json.success) {
      setError(json.error || "Failed to create site");
      return;
    }

    setSiteName("");
    setOrigins("");
    setNewSiteResult({ site: json.data, apiKey: json.apiKey });
    loadAll();
  }

  async function handleArchiveToggle() {
    const res = await fetch(`/api/projects/${projectId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ archived: !project.archived_at }),
    });
    const json = await res.json();
    if (json.success) setProject(json.data);
  }

  async function handleDeleteProject() {
    if (!confirm(`Delete project "${project.name}"? Its sites will be kept but unlinked.`)) return;
    const res = await fetch(`/api/projects/${projectId}`, { method: "DELETE" });
    const json = await res.json();
    if (json.success) router.push("/dashboard");
  }

  async function handleInvite(e) {
    e.preventDefault();
    setInviteError(null);
    setInviting(true);

    const res = await fetch(`/api/projects/${projectId}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: inviteEmail }),
    });
    const json = await res.json();
    setInviting(false);

    if (!json.success) {
      const messages = {
        no_account_for_email: "No WebNew account exists for that email yet.",
        already_a_member: "That person is already a member of this project.",
        already_owner: "That's you — you already own this project.",
      };
      setInviteError(messages[json.error] || json.error || "Failed to invite");
      return;
    }

    setInviteEmail("");
    loadAll();
  }

  async function handleRemoveMember(memberUserId) {
    if (!confirm("Remove this member from the project? They'll lose access to all its sites.")) {
      return;
    }
    const res = await fetch(`/api/projects/${projectId}/members/${memberUserId}`, {
      method: "DELETE",
    });
    const json = await res.json();
    if (json.success) loadAll();
  }

  if (loading) return <p className="text-sm text-white/50">Loading...</p>;
  if (!project) return <p className="text-sm text-brand-red-400">Project not found.</p>;

  // This dashboard and /cdn/webnew.js + /api/translate are the same Next.js
  // app, so the browser's own origin is always the correct base URL --
  // preferred over NEXT_PUBLIC_BASE_URL, which can silently drift out of sync
  // with whatever domain is actually serving this deployment.
  const baseUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_BASE_URL || "https://your-deployment-domain.com";
  const embedSnippet = newSiteResult
    ? `<script\n  src="${baseUrl}/cdn/webnew.js"\n  data-base-url="${baseUrl}"\n  data-api-key="${newSiteResult.apiKey}"\n  data-default-lang=""\n  async\n></script>`
    : "";

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/dashboard" className="text-sm text-white/50 hover:text-white hover:underline">
        ← All projects
      </Link>

      <div className="mt-2 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-white">
          {project.name}
          {project.archived_at && (
            <span className="ml-2 rounded bg-white/10 px-2 py-0.5 text-xs font-normal text-white/60">
              Archived
            </span>
          )}
        </h1>
        {project.isOwner && (
          <div className="flex gap-2">
            <button
              onClick={handleArchiveToggle}
              className="rounded border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white transition hover:bg-white/10"
            >
              {project.archived_at ? "Unarchive" : "Archive"}
            </button>
            <button
              onClick={handleDeleteProject}
              className="rounded border border-brand-red-500/50 px-3 py-1.5 text-sm text-brand-red-400 transition hover:bg-brand-red-500/10"
            >
              Delete
            </button>
          </div>
        )}
      </div>

      <h2 className="mt-8 text-lg font-medium text-white">Sites</h2>

      {sites.length === 0 ? (
        <p className="mt-2 text-sm text-white/50">No sites yet in this project.</p>
      ) : (
        <ul className="mt-2 divide-y divide-white/10 rounded-xl border border-white/10 bg-white/5 shadow-[0_10px_30px_rgba(0,0,0,0.3)]">
          {sites.map((site) => (
            <li key={site.id}>
              <Link
                href={`/dashboard/projects/${projectId}/sites/${site.id}`}
                className="flex items-center justify-between px-4 py-3 transition hover:bg-white/10"
              >
                <span className="font-medium text-white">{site.name}</span>
                <span
                  className={`text-xs ${site.is_active ? "text-green-400" : "text-white/40"}`}
                >
                  {site.is_active ? "Active" : "Paused"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <h3 className="mt-8 text-base font-medium text-white">Register a new site</h3>
      <form onSubmit={handleCreateSite} className="mt-2 flex flex-col gap-3">
        <input
          type="text"
          required
          placeholder="Site name"
          value={siteName}
          onChange={(e) => setSiteName(e.target.value)}
          className="rounded border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 outline-none transition focus:border-brand-red-500"
        />
        <input
          type="text"
          required
          placeholder="Allowed origins, comma-separated (e.g. example.com, www.example.com)"
          value={origins}
          onChange={(e) => setOrigins(e.target.value)}
          className="rounded border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 outline-none transition focus:border-brand-red-500"
        />
        <button
          type="submit"
          disabled={creatingSite}
          className="self-start rounded bg-brand-cta px-4 py-2 text-sm font-medium text-white shadow-[0_4px_15px_rgba(148,13,13,0.3)] transition hover:bg-brand-cta-hover disabled:opacity-50"
        >
          {creatingSite ? "Registering..." : "Register Site"}
        </button>
      </form>
      {error && <p className="mt-2 text-sm text-brand-red-400">{error}</p>}

      {newSiteResult && (
        <div className="mt-4 rounded-xl border border-amber-400/30 bg-amber-400/10 p-4">
          <p className="text-sm font-medium text-amber-200">
            Save this API key now — it will not be shown again.
          </p>
          <code className="mt-2 block break-all rounded bg-black/30 p-2 text-xs text-white">
            {newSiteResult.apiKey}
          </code>
          <p className="mt-3 text-sm font-medium text-amber-200">Embed snippet</p>
          <pre className="mt-2 overflow-x-auto rounded bg-black/30 p-2 text-xs text-white">
            {embedSnippet}
          </pre>
        </div>
      )}

      <h2 className="mt-8 text-lg font-medium text-white">Members</h2>
      <ul className="mt-2 divide-y divide-white/10 rounded-xl border border-white/10 bg-white/5 shadow-[0_10px_30px_rgba(0,0,0,0.3)]">
        <li className="flex items-center justify-between px-4 py-3">
          <span className="text-white">Owner</span>
          <span className="text-xs text-white/40">Owner</span>
        </li>
        {members.map((member) => (
          <li key={member.id} className="flex items-center justify-between px-4 py-3">
            <span className="text-white">{member.profiles?.email || member.user_id}</span>
            {project.isOwner && (
              <button
                onClick={() => handleRemoveMember(member.user_id)}
                className="text-sm text-brand-red-400 hover:underline"
              >
                Remove
              </button>
            )}
          </li>
        ))}
      </ul>

      {project.isOwner && (
        <form onSubmit={handleInvite} className="mt-4 flex gap-2">
          <input
            type="email"
            required
            placeholder="Invite by email (they must already have a WebNew account)"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            className="flex-1 rounded border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 outline-none transition focus:border-brand-red-500"
          />
          <button
            type="submit"
            disabled={inviting}
            className="rounded bg-brand-cta px-4 py-2 text-sm font-medium text-white shadow-[0_4px_15px_rgba(148,13,13,0.3)] transition hover:bg-brand-cta-hover disabled:opacity-50"
          >
            {inviting ? "Inviting..." : "Invite"}
          </button>
        </form>
      )}
      {inviteError && <p className="mt-2 text-sm text-brand-red-400">{inviteError}</p>}
    </div>
  );
}
