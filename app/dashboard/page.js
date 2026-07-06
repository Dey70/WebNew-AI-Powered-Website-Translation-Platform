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
      <h1 className="text-2xl font-semibold">Projects</h1>
      <p className="mt-1 text-slate-600">
        Group your websites into projects. Each project can hold multiple sites.
      </p>

      <form onSubmit={handleCreate} className="mt-6 flex gap-2">
        <input
          type="text"
          required
          placeholder="Project name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="flex-1 rounded border border-slate-300 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={creating}
          className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {creating ? "Creating..." : "New Project"}
        </button>
      </form>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      <div className="mt-8">
        {loading ? (
          <p className="text-sm text-slate-500">Loading...</p>
        ) : projects.length === 0 ? (
          <p className="text-sm text-slate-500">
            No projects yet. Create one above to register your first website.
          </p>
        ) : (
          <ul className="divide-y divide-slate-200 rounded border border-slate-200 bg-white">
            {projects.map((project) => (
              <li key={project.id}>
                <Link
                  href={`/dashboard/projects/${project.id}`}
                  className="block px-4 py-3 hover:bg-slate-50"
                >
                  <span className="font-medium">{project.name}</span>
                  <span className="ml-2 text-sm text-slate-400">/{project.slug}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
