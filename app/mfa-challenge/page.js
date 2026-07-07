"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function MfaChallengePage() {
  const router = useRouter();
  const [factorId, setFactorId] = useState(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    async function loadFactor() {
      const supabase = createClient();
      const { data, error: listError } = await supabase.auth.mfa.listFactors();

      if (listError || !data) {
        setError("Could not load your two-factor setup. Try logging in again.");
        setLoading(false);
        return;
      }

      const totp = data.totp.find((f) => f.status === "verified");
      if (!totp) {
        // No verified factor after all -- nothing to challenge, back to the dashboard.
        router.push("/dashboard");
        return;
      }

      setFactorId(totp.id);
      setLoading(false);
    }
    loadFactor();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setVerifying(true);

    const supabase = createClient();
    const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({
      factorId,
      code,
    });

    setVerifying(false);

    if (verifyError) {
      setError(verifyError.message);
      return;
    }

    // A client-side router.push here can race the Supabase auth cookie
    // actually committing the new (post-verify) AAL level -- the dashboard
    // layout's server-side check would then read the stale pre-verify state
    // and silently bounce back to this same page. A hard navigation
    // guarantees the next request carries the fully-committed cookie.
    window.location.href = "/dashboard";
  }

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut({ scope: "global" });
    router.push("/login");
  }

  if (loading) {
    return (
      <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4">
        <p className="text-sm text-white/50">Loading...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4">
      <h1 className="mb-2 text-2xl font-semibold text-white">Enter your 2FA code</h1>
      <p className="mb-6 text-sm text-white/60">
        Open your authenticator app and enter the 6-digit code for WebNew.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          required
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          placeholder="123456"
          className="rounded border border-white/10 bg-white/5 px-3 py-2 text-center text-lg tracking-[0.5em] text-white placeholder-white/30 outline-none transition focus:border-brand-red-500"
        />

        {error && <p className="text-sm text-brand-red-400">{error}</p>}

        <button
          type="submit"
          disabled={verifying || !factorId || code.length !== 6}
          className="rounded bg-brand-cta px-3 py-2 text-sm font-medium text-white shadow-[0_4px_15px_rgba(148,13,13,0.3)] transition hover:bg-brand-cta-hover disabled:opacity-50"
        >
          {verifying ? "Verifying..." : "Verify"}
        </button>
      </form>

      <button
        type="button"
        onClick={handleLogout}
        className="mt-6 text-sm text-white/50 hover:text-white hover:underline"
      >
        Log out instead
      </button>
    </main>
  );
}
