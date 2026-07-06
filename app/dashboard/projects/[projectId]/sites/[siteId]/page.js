"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

export default function SiteDetailPage() {
  const { projectId, siteId } = useParams();
  const router = useRouter();

  const [site, setSite] = useState(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [origins, setOrigins] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [newKey, setNewKey] = useState(null);
  const [regenerating, setRegenerating] = useState(false);

  async function loadSite() {
    setLoading(true);
    const res = await fetch(`/api/sites/${siteId}`);
    const json = await res.json();
    if (json.success) {
      setSite(json.data);
      setName(json.data.name);
      setOrigins(json.data.allowed_origins.join(", "));
    }
    setLoading(false);
  }

  useEffect(() => {
    loadSite();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteId]);

  async function handleSave(e) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    const allowedOrigins = origins
      .split(",")
      .map((o) => o.trim())
      .filter(Boolean);

    const res = await fetch(`/api/sites/${siteId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, allowedOrigins }),
    });
    const json = await res.json();
    setSaving(false);

    if (!json.success) {
      setError(json.error || "Failed to save");
      return;
    }
    loadSite();
  }

  async function handleToggleActive() {
    const res = await fetch(`/api/sites/${siteId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !site.is_active }),
    });
    const json = await res.json();
    if (json.success) setSite((prev) => ({ ...prev, is_active: json.data.is_active }));
  }

  async function handleRegenerateKey() {
    if (
      !confirm(
        "This immediately revokes the current API key. Any embedded widget using it will stop working until you update it with the new key. Continue?"
      )
    )
      return;

    setRegenerating(true);
    setNewKey(null);
    const res = await fetch(`/api/sites/${siteId}/regenerate-key`, { method: "POST" });
    const json = await res.json();
    setRegenerating(false);

    if (!json.success) {
      setError(json.error || "Failed to regenerate key");
      return;
    }
    setNewKey(json.apiKey);
    loadSite();
  }

  async function handleDeleteSite() {
    if (!confirm(`Delete site "${site.name}"? This also deletes its translation history.`)) return;
    const res = await fetch(`/api/sites/${siteId}`, { method: "DELETE" });
    const json = await res.json();
    if (json.success) router.push(`/dashboard/projects/${projectId}`);
  }

  if (loading) return <p className="text-sm text-slate-500">Loading...</p>;
  if (!site) return <p className="text-sm text-red-600">Site not found.</p>;

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://your-deployment-domain.com";
  const embedSnippet = newKey
    ? `<script\n  src="${baseUrl}/cdn/webnew.js"\n  data-base-url="${baseUrl}"\n  data-api-key="${newKey}"\n  data-default-lang=""\n  async\n></script>`
    : `<script\n  src="${baseUrl}/cdn/webnew.js"\n  data-base-url="${baseUrl}"\n  data-api-key="YOUR_API_KEY"\n  data-default-lang=""\n  async\n></script>`;

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href={`/dashboard/projects/${projectId}`}
        className="text-sm text-slate-500 hover:underline"
      >
        ← Back to project
      </Link>

      <div className="mt-2 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{site.name}</h1>
        <div className="flex gap-2">
          <button
            onClick={handleToggleActive}
            className="rounded border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50"
          >
            {site.is_active ? "Pause translation" : "Resume translation"}
          </button>
          <button
            onClick={handleDeleteSite}
            className="rounded border border-red-300 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
          >
            Delete site
          </button>
        </div>
      </div>

      <form onSubmit={handleSave} className="mt-6 flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-sm">
          Name
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded border border-slate-300 px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Allowed origins (comma-separated)
          <input
            type="text"
            value={origins}
            onChange={(e) => setOrigins(e.target.value)}
            className="rounded border border-slate-300 px-3 py-2"
          />
        </label>
        <button
          type="submit"
          disabled={saving}
          className="self-start rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save changes"}
        </button>
      </form>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      <h2 className="mt-8 text-lg font-medium">Embed snippet</h2>
      <pre className="mt-2 overflow-x-auto rounded border border-slate-200 bg-white p-3 text-xs">
        {embedSnippet}
      </pre>
      {!newKey && (
        <p className="mt-1 text-xs text-slate-500">
          The API key was only shown once, at creation or the last time you regenerated it.
          Replace <code>YOUR_API_KEY</code> above with the value you saved.
        </p>
      )}

      <h2 className="mt-8 text-lg font-medium">API key</h2>
      <p className="mt-1 text-sm text-slate-600">
        Current key prefix:{" "}
        <code className="rounded bg-slate-100 px-1.5 py-0.5">
          {site.apiKeys?.find((k) => k.is_active)?.key_prefix || "none active"}
        </code>
      </p>
      <button
        onClick={handleRegenerateKey}
        disabled={regenerating}
        className="mt-2 rounded border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50 disabled:opacity-50"
      >
        {regenerating ? "Regenerating..." : "Revoke & regenerate key"}
      </button>

      {newKey && (
        <div className="mt-4 rounded border border-amber-300 bg-amber-50 p-4">
          <p className="text-sm font-medium text-amber-900">
            Save this new API key now — it will not be shown again.
          </p>
          <code className="mt-2 block break-all rounded bg-white p-2 text-xs">{newKey}</code>
        </div>
      )}
    </div>
  );
}
