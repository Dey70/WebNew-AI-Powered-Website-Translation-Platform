"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });

    setLoading(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setDone(true);
    setTimeout(() => router.push("/login"), 1500);
  }

  if (done) {
    return (
      <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4 text-center">
        <h1 className="mb-2 text-2xl font-semibold text-white">Password updated</h1>
        <p className="text-sm text-white/60">Redirecting you to log in...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4">
      <h1 className="mb-6 text-2xl font-semibold text-white">Choose a new password</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm text-white/80">
          New password
          <input
            type="password"
            required
            minLength={8}
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
          {loading ? "Saving..." : "Save new password"}
        </button>
      </form>
    </main>
  );
}
