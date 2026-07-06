"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

const ACCENT = "#2a78d6"; // validated sequential blue, see dataviz skill

function StatTile({ label, value }) {
  return (
    <div className="rounded border border-slate-200 bg-white p-4">
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-semibold tabular-nums">{value.toLocaleString()}</div>
    </div>
  );
}

function DailyBarChart({ dailyCounts }) {
  const max = Math.max(1, ...dailyCounts.map((d) => d.count));
  const width = 600;
  const height = 160;
  const barGap = 2;
  const barWidth = width / dailyCounts.length - barGap;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full"
      role="img"
      aria-label="Translation requests per day, last 30 days"
    >
      <line x1={0} y1={height - 0.5} x2={width} y2={height - 0.5} stroke="#c3c2b7" strokeWidth="1" />
      {dailyCounts.map((d, i) => {
        const barHeight = (d.count / max) * (height - 12);
        const x = i * (barWidth + barGap);
        const y = height - barHeight;
        return (
          <rect key={d.day} x={x} y={y} width={barWidth} height={barHeight} rx={2} fill={ACCENT}>
            <title>
              {d.day}: {d.count} request{d.count === 1 ? "" : "s"}
            </title>
          </rect>
        );
      })}
    </svg>
  );
}

function LanguageBreakdown({ languageCounts }) {
  if (languageCounts.length === 0) {
    return <p className="text-sm text-slate-500">No translations yet.</p>;
  }
  const max = languageCounts[0].count;
  return (
    <div className="flex flex-col gap-2">
      {languageCounts.map(({ language, count }) => (
        <div key={language} className="flex items-center gap-3 text-sm">
          <div className="w-24 shrink-0 capitalize text-slate-700">{language}</div>
          <div className="flex-1 rounded bg-slate-100">
            <div
              className="h-4 rounded"
              style={{ width: `${(count / max) * 100}%`, backgroundColor: ACCENT }}
              title={`${language}: ${count}`}
            />
          </div>
          <div className="w-10 shrink-0 text-right tabular-nums text-slate-500">{count}</div>
        </div>
      ))}
    </div>
  );
}

export default function SiteAnalyticsPage() {
  const { projectId, siteId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const res = await fetch(`/api/sites/${siteId}/analytics`);
      const json = await res.json();
      if (json.success) setData(json.data);
      setLoading(false);
    }
    load();
  }, [siteId]);

  if (loading) return <p className="text-sm text-slate-500">Loading...</p>;
  if (!data) return <p className="text-sm text-red-600">Failed to load analytics.</p>;

  const last30DaysCount = data.dailyCounts.reduce((sum, d) => sum + d.count, 0);

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href={`/dashboard/projects/${projectId}/sites/${siteId}`}
        className="text-sm text-slate-500 hover:underline"
      >
        ← Back to site
      </Link>

      <h1 className="mt-2 text-2xl font-semibold">Analytics</h1>
      <p className="mt-1 text-sm text-slate-500">
        Based on successful translations only — failed requests aren't logged yet.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-4">
        <StatTile label="All-time translations" value={data.totalCount} />
        <StatTile label="Last 30 days" value={last30DaysCount} />
      </div>

      <h2 className="mt-8 text-lg font-medium">Requests per day (last 30 days)</h2>
      <div className="mt-2 rounded border border-slate-200 bg-white p-4">
        <DailyBarChart dailyCounts={data.dailyCounts} />
      </div>

      <h2 className="mt-8 text-lg font-medium">By target language</h2>
      <div className="mt-2 rounded border border-slate-200 bg-white p-4">
        <LanguageBreakdown languageCounts={data.languageCounts} />
      </div>

      <h2 className="mt-8 text-lg font-medium">Recent activity</h2>
      {data.recent.length === 0 ? (
        <p className="mt-2 text-sm text-slate-500">No translations yet.</p>
      ) : (
        <table className="mt-2 w-full rounded border border-slate-200 bg-white text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500">
              <th className="px-3 py-2">Original</th>
              <th className="px-3 py-2">Translated</th>
              <th className="px-3 py-2">Language</th>
              <th className="px-3 py-2">When</th>
            </tr>
          </thead>
          <tbody>
            {data.recent.map((row) => (
              <tr key={row.id} className="border-b border-slate-100 last:border-0">
                <td className="max-w-[200px] truncate px-3 py-2">{row.original_text}</td>
                <td className="max-w-[200px] truncate px-3 py-2">{row.translated_text}</td>
                <td className="px-3 py-2 capitalize">{row.target_language}</td>
                <td className="px-3 py-2 text-slate-500">
                  {new Date(row.created_at).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
