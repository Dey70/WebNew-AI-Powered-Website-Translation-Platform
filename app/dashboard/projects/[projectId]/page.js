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

  async function loadAll() {
    setLoading(true);
    const [projectRes, sitesRes] = await Promise.all([
      fetch(`/api/projects/${projectId}`),
      fetch(`/api/sites?projectId=${projectId}`),
    ]);
    const projectJson = await projectRes.json();
    const sitesJson = await sitesRes.json();

    if (projectJson.success) setProject(projectJson.data);
    if (sitesJson.success) setSites(sitesJson.data);
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

  if (loading) return <p className="text-sm text-slate-500">Loading...</p>;
  if (!project) return <p className="text-sm text-red-600">Project not found.</p>;

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://your-deployment-domain.com";
  const embedSnippet = newSiteResult
    ? `<script\n  src="${baseUrl}/cdn/webnew.js"\n  data-base-url="${baseUrl}"\n  data-api-key="${newSiteResult.apiKey}"\n  data-default-lang=""\n  async\n></script>`
    : "";

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/dashboard" className="text-sm text-slate-500 hover:underline">
        ← All projects
      </Link>

      <div className="mt-2 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">
          {project.name}
          {project.archived_at && (
            <span className="ml-2 rounded bg-slate-200 px-2 py-0.5 text-xs font-normal text-slate-600">
              Archived
            </span>
          )}
        </h1>
        <div className="flex gap-2">
          <button
            onClick={handleArchiveToggle}
            className="rounded border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50"
          >
            {project.archived_at ? "Unarchive" : "Archive"}
          </button>
          <button
            onClick={handleDeleteProject}
            className="rounded border border-red-300 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
          >
            Delete
          </button>
        </div>
      </div>

      <h2 className="mt-8 text-lg font-medium">Sites</h2>

      {sites.length === 0 ? (
        <p className="mt-2 text-sm text-slate-500">No sites yet in this project.</p>
      ) : (
        <ul className="mt-2 divide-y divide-slate-200 rounded border border-slate-200 bg-white">
          {sites.map((site) => (
            <li key={site.id}>
              <Link
                href={`/dashboard/projects/${projectId}/sites/${site.id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-slate-50"
              >
                <span className="font-medium">{site.name}</span>
                <span
                  className={`text-xs ${site.is_active ? "text-green-600" : "text-slate-400"}`}
                >
                  {site.is_active ? "Active" : "Paused"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <h3 className="mt-8 text-base font-medium">Register a new site</h3>
      <form onSubmit={handleCreateSite} className="mt-2 flex flex-col gap-3">
        <input
          type="text"
          required
          placeholder="Site name"
          value={siteName}
          onChange={(e) => setSiteName(e.target.value)}
          className="rounded border border-slate-300 px-3 py-2 text-sm"
        />
        <input
          type="text"
          required
          placeholder="Allowed origins, comma-separated (e.g. example.com, www.example.com)"
          value={origins}
          onChange={(e) => setOrigins(e.target.value)}
          className="rounded border border-slate-300 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={creatingSite}
          className="self-start rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {creatingSite ? "Registering..." : "Register Site"}
        </button>
      </form>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      {newSiteResult && (
        <div className="mt-4 rounded border border-amber-300 bg-amber-50 p-4">
          <p className="text-sm font-medium text-amber-900">
            Save this API key now — it will not be shown again.
          </p>
          <code className="mt-2 block break-all rounded bg-white p-2 text-xs">
            {newSiteResult.apiKey}
          </code>
          <p className="mt-3 text-sm font-medium text-amber-900">Embed snippet</p>
          <pre className="mt-2 overflow-x-auto rounded bg-white p-2 text-xs">{embedSnippet}</pre>
        </div>
      )}
    </div>
  );
}
