"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Only list providers actually enabled in Supabase Auth -- an unenabled
// provider sends the browser to Supabase's raw /authorize endpoint, which
// 400s with a JSON error page instead of failing gracefully in the UI.
const OAUTH_PROVIDERS = [
  { id: "google", label: "Google" },
  { id: "github", label: "GitHub" },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (signInError) {
      setError(signInError.message);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  async function handleOAuth(provider) {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4">
      <h1 className="mb-6 text-2xl font-semibold text-white">Log in to WebNew</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm text-white/80">
          Email
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded border border-white/10 bg-white/5 px-3 py-2 text-white placeholder-white/30 outline-none transition focus:border-brand-red-500"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm text-white/80">
          Password
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded border border-white/10 bg-white/5 px-3 py-2 text-white placeholder-white/30 outline-none transition focus:border-brand-red-500"
          />
        </label>

        {error && <p className="text-sm text-brand-red-400">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="rounded bg-brand-cta px-3 py-2 text-sm font-medium text-white shadow-[0_4px_15px_rgba(148,13,13,0.3)] transition hover:bg-brand-cta-hover disabled:opacity-50"
        >
          {loading ? "Logging in..." : "Log in"}
        </button>
      </form>

      <div className="my-6 flex items-center gap-3 text-xs text-white/40">
        <span className="h-px flex-1 bg-white/10" />
        or continue with
        <span className="h-px flex-1 bg-white/10" />
      </div>

      <div className="flex flex-col gap-2">
        {OAUTH_PROVIDERS.map((provider) => (
          <button
            key={provider.id}
            type="button"
            onClick={() => handleOAuth(provider.id)}
            className="rounded border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/10"
          >
            {provider.label}
          </button>
        ))}
      </div>

      <div className="mt-6 flex justify-between text-sm text-white/50">
        <Link href="/forgot-password" className="hover:text-white hover:underline">
          Forgot password?
        </Link>
        <Link href="/signup" className="hover:text-white hover:underline">
          Create account
        </Link>
      </div>
    </main>
  );
}
