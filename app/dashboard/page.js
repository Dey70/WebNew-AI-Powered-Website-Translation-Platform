"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function DashboardPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);

  async function loadProjects() {
    setLoading(true);
    const res = await fetch("/api/projects");
    const json = await res.json();
    if (json.success) setProjects(json.data);
    setLoading(false);
  }

  useEffect(() => {
    loadProjects();
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
    loadProjects();
  }

  return (
    <div className="mx-auto max-w-3xl">
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
