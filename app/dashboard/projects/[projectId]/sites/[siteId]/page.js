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
  const [provider, setProvider] = useState("mymemory");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [newKey, setNewKey] = useState(null);
  const [keyLabel, setKeyLabel] = useState("");
  const [creatingKey, setCreatingKey] = useState(false);
  const [revokingKeyId, setRevokingKeyId] = useState(null);

  async function loadSite() {
    setLoading(true);
    const res = await fetch(`/api/sites/${siteId}`);
    const json = await res.json();
    if (json.success) {
      setSite(json.data);
      setName(json.data.name);
      setOrigins(json.data.allowed_origins.join(", "));
      setProvider(json.data.provider || "mymemory");
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
      body: JSON.stringify({ name, allowedOrigins, provider }),
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

  async function handleCreateKey(e) {
    e.preventDefault();
    setError(null);
    setCreatingKey(true);
    setNewKey(null);

    const res = await fetch(`/api/sites/${siteId}/keys`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: keyLabel }),
    });
    const json = await res.json();
    setCreatingKey(false);

    if (!json.success) {
      setError(json.error || "Failed to create key");
      return;
    }
    setKeyLabel("");
    setNewKey(json.apiKey);
    loadSite();
  }

  async function handleRevokeKey(keyId) {
    const activeCount = (site.apiKeys || []).filter((k) => k.is_active).length;
    const warning =
      activeCount <= 1
        ? "This is the site's only active key. Revoking it will stop translation until a new key is issued and deployed. Continue?"
        : "Revoke this API key? Any embedded widget still using it will stop working immediately.";
    if (!confirm(warning)) return;

    setRevokingKeyId(keyId);
    const res = await fetch(`/api/sites/${siteId}/keys/${keyId}`, { method: "DELETE" });
    const json = await res.json();
    setRevokingKeyId(null);

    if (!json.success) {
      setError(json.error || "Failed to revoke key");
      return;
    }
    loadSite();
  }

  async function handleDeleteSite() {
    if (!confirm(`Delete site "${site.name}"? This also deletes its translation history.`)) return;
    const res = await fetch(`/api/sites/${siteId}`, { method: "DELETE" });
    const json = await res.json();
    if (json.success) router.push(`/dashboard/projects/${projectId}`);
  }

  if (loading) return <p className="text-sm text-white/50">Loading...</p>;
  if (!site) return <p className="text-sm text-brand-red-400">Site not found.</p>;

  // This dashboard and /cdn/webnew.js + /api/translate are the same Next.js
  // app, so the browser's own origin is always the correct base URL --
  // preferred over NEXT_PUBLIC_BASE_URL, which can silently drift out of sync
  // with whatever domain is actually serving this deployment.
  const baseUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_BASE_URL || "https://your-deployment-domain.com";
  const embedSnippet = newKey
    ? `<script\n  src="${baseUrl}/cdn/webnew.js"\n  data-base-url="${baseUrl}"\n  data-api-key="${newKey}"\n  data-default-lang=""\n  async\n></script>`
    : `<script\n  src="${baseUrl}/cdn/webnew.js"\n  data-base-url="${baseUrl}"\n  data-api-key="YOUR_API_KEY"\n  data-default-lang=""\n  async\n></script>`;

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href={`/dashboard/projects/${projectId}`}
        className="text-sm text-white/50 hover:text-white hover:underline"
      >
        ← Back to project
      </Link>

      <div className="mt-2 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-white">{site.name}</h1>
        <div className="flex items-center gap-2">
          <Link
            href={`/dashboard/projects/${projectId}/sites/${siteId}/analytics`}
            className="text-sm text-white/50 hover:text-white hover:underline"
          >
            View analytics →
          </Link>
          <button
            onClick={handleToggleActive}
            className="rounded border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white transition hover:bg-white/10"
          >
            {site.is_active ? "Pause translation" : "Resume translation"}
          </button>
          <button
            onClick={handleDeleteSite}
            className="rounded border border-brand-red-500/50 px-3 py-1.5 text-sm text-brand-red-400 transition hover:bg-brand-red-500/10"
          >
            Delete site
          </button>
        </div>
      </div>

      <form onSubmit={handleSave} className="mt-6 flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-sm text-white/80">
          Name
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded border border-white/10 bg-white/5 px-3 py-2 text-white outline-none transition focus:border-brand-red-500"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-white/80">
          Allowed origins (comma-separated)
          <input
            type="text"
            value={origins}
            onChange={(e) => setOrigins(e.target.value)}
            className="rounded border border-white/10 bg-white/5 px-3 py-2 text-white outline-none transition focus:border-brand-red-500"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-white/80">
          Translation provider
          <select
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
            className="rounded border border-white/10 bg-brand-charcoal px-3 py-2 text-white outline-none transition focus:border-brand-red-500"
          >
            <option value="mymemory">MyMemory (default, free)</option>
            <option value="deepl">DeepL (requires DEEPL_API_KEY)</option>
          </select>
        </label>
        <button
          type="submit"
          disabled={saving}
          className="self-start rounded bg-brand-cta px-4 py-2 text-sm font-medium text-white shadow-[0_4px_15px_rgba(148,13,13,0.3)] transition hover:bg-brand-cta-hover disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save changes"}
        </button>
      </form>
      {error && <p className="mt-2 text-sm text-brand-red-400">{error}</p>}

      <h2 className="mt-8 text-lg font-medium text-white">Embed snippet</h2>
      <pre className="mt-2 overflow-x-auto rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-white">
        {embedSnippet}
      </pre>
      {!newKey && (
        <p className="mt-1 text-xs text-white/40">
          The API key was only shown once, at creation or the last time you regenerated it.
          Replace <code>YOUR_API_KEY</code> above with the value you saved.
        </p>
      )}

      <h2 className="mt-8 text-lg font-medium text-white">API keys</h2>

      {(site.apiKeys || []).length === 0 ? (
        <p className="mt-2 text-sm text-white/50">No keys yet.</p>
      ) : (
        <table className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 text-sm shadow-[0_10px_30px_rgba(0,0,0,0.3)]">
          <thead>
            <tr className="border-b border-white/10 text-left text-xs uppercase text-white/40">
              <th className="px-3 py-2">Label</th>
              <th className="px-3 py-2">Prefix</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Created</th>
              <th className="px-3 py-2">Last used</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {site.apiKeys.map((key) => (
              <tr key={key.id} className="border-b border-white/5 text-white last:border-0">
                <td className="px-3 py-2">{key.label || "Unnamed key"}</td>
                <td className="px-3 py-2">
                  <code className="rounded bg-black/30 px-1.5 py-0.5">{key.key_prefix}</code>
                </td>
                <td className="px-3 py-2">
                  {key.is_active ? (
                    <span className="text-green-400">Active</span>
                  ) : (
                    <span className="text-white/40">Revoked</span>
                  )}
                </td>
                <td className="px-3 py-2 text-white/50">
                  {new Date(key.created_at).toLocaleDateString()}
                </td>
                <td className="px-3 py-2 text-white/50">
                  {key.last_used_at ? new Date(key.last_used_at).toLocaleDateString() : "Never"}
                </td>
                <td className="px-3 py-2 text-right">
                  {key.is_active && (
                    <button
                      onClick={() => handleRevokeKey(key.id)}
                      disabled={revokingKeyId === key.id}
                      className="text-brand-red-400 hover:underline disabled:opacity-50"
                    >
                      {revokingKeyId === key.id ? "Revoking..." : "Revoke"}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <form onSubmit={handleCreateKey} className="mt-4 flex gap-2">
        <input
          type="text"
          placeholder="Label (optional, e.g. Production)"
          value={keyLabel}
          onChange={(e) => setKeyLabel(e.target.value)}
          className="flex-1 rounded border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 outline-none transition focus:border-brand-red-500"
        />
        <button
          type="submit"
          disabled={creatingKey}
          className="rounded bg-brand-cta px-4 py-2 text-sm font-medium text-white shadow-[0_4px_15px_rgba(148,13,13,0.3)] transition hover:bg-brand-cta-hover disabled:opacity-50"
        >
          {creatingKey ? "Creating..." : "Create new key"}
        </button>
      </form>

      {newKey && (
        <div className="mt-4 rounded-xl border border-amber-400/30 bg-amber-400/10 p-4">
          <p className="text-sm font-medium text-amber-200">
            Save this new API key now — it will not be shown again.
          </p>
          <code className="mt-2 block break-all rounded bg-black/30 p-2 text-xs text-white">
            {newKey}
          </code>
        </div>
      )}
    </div>
  );
}
