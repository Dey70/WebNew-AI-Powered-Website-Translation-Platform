"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    setLoading(false);

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    setSubmitted(true);
  }

  if (submitted) {
    return (
      <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4 text-center">
        <h1 className="mb-2 text-2xl font-semibold text-white">Check your email</h1>
        <p className="text-sm text-white/60">
          We sent a confirmation link to <strong className="text-white">{email}</strong>. Click it
          to verify your account and finish signing up.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4">
      <h1 className="mb-6 text-2xl font-semibold text-white">Create your WebNew account</h1>

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
          {loading ? "Creating account..." : "Create account"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-white/50">
        Already have an account?{" "}
        <Link href="/login" className="hover:text-white hover:underline">
          Log in
        </Link>
      </p>
    </main>
  );
}
