"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function SecurityPage() {
  const [loading, setLoading] = useState(true);
  const [verifiedFactor, setVerifiedFactor] = useState(null);
  const [enrollment, setEnrollment] = useState(null); // { id, qrCode, secret }
  const [code, setCode] = useState("");
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [signingOutOthers, setSigningOutOthers] = useState(false);
  const [signOutOthersMessage, setSignOutOthersMessage] = useState(null);

  async function loadFactors() {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase.auth.mfa.listFactors();
    setVerifiedFactor((data?.totp || []).find((f) => f.status === "verified") || null);
    setLoading(false);
  }

  useEffect(() => {
    loadFactors();
  }, []);

  async function handleStartEnroll() {
    setError(null);
    setBusy(true);
    const supabase = createClient();

    // Clean up any abandoned, never-verified attempt before starting a fresh one.
    const { data: existing } = await supabase.auth.mfa.listFactors();
    const unverified = (existing?.totp || []).find((f) => f.status !== "verified");
    if (unverified) {
      await supabase.auth.mfa.unenroll({ factorId: unverified.id });
    }

    const { data, error: enrollError } = await supabase.auth.mfa.enroll({ factorType: "totp" });
    setBusy(false);

    if (enrollError) {
      setError(enrollError.message);
      return;
    }

    setEnrollment({ id: data.id, qrCode: data.totp.qr_code, secret: data.totp.secret });
  }

  async function handleVerify(e) {
    e.preventDefault();
    setError(null);
    setBusy(true);

    const supabase = createClient();
    const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({
      factorId: enrollment.id,
      code,
    });

    setBusy(false);

    if (verifyError) {
      setError(verifyError.message);
      return;
    }

    setEnrollment(null);
    setCode("");
    loadFactors();
  }

  async function handleRemove() {
    if (!confirm("Remove two-factor authentication? Logging in will only require your password afterward.")) {
      return;
    }
    setBusy(true);
    const supabase = createClient();
    await supabase.auth.mfa.unenroll({ factorId: verifiedFactor.id });
    setBusy(false);
    loadFactors();
  }

  async function handleSignOutOthers() {
    if (
      !confirm(
        "Log out every other session for this account (other browsers/devices)? This one stays signed in."
      )
    ) {
      return;
    }
    setSigningOutOthers(true);
    setSignOutOthersMessage(null);
    const supabase = createClient();
    const { error: signOutError } = await supabase.auth.signOut({ scope: "others" });
    setSigningOutOthers(false);
    setSignOutOthersMessage(
      signOutError ? signOutError.message : "Other sessions have been signed out."
    );
  }

  if (loading) return <p className="text-sm text-white/50">Loading...</p>;

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-semibold text-white">Security</h1>
      <p className="mt-1 text-sm text-white/60">
        Add a second step to your login using an authenticator app (Google Authenticator, Authy,
        1Password, etc.).
      </p>

      <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-6 shadow-[0_10px_30px_rgba(0,0,0,0.3)]">
        <h2 className="text-lg font-medium text-white">Two-factor authentication</h2>

        {verifiedFactor && !enrollment && (
          <>
            <p className="mt-2 text-sm text-green-400">Enabled</p>
            <button
              onClick={handleRemove}
              disabled={busy}
              className="mt-4 rounded border border-brand-red-500/50 px-3 py-1.5 text-sm text-brand-red-400 transition hover:bg-brand-red-500/10 disabled:opacity-50"
            >
              {busy ? "Removing..." : "Remove 2FA"}
            </button>
          </>
        )}

        {!verifiedFactor && !enrollment && (
          <>
            <p className="mt-2 text-sm text-white/50">Not enabled.</p>
            <button
              onClick={handleStartEnroll}
              disabled={busy}
              className="mt-4 rounded bg-brand-cta px-4 py-2 text-sm font-medium text-white shadow-[0_4px_15px_rgba(148,13,13,0.3)] transition hover:bg-brand-cta-hover disabled:opacity-50"
            >
              {busy ? "Starting..." : "Enable 2FA"}
            </button>
          </>
        )}

        {enrollment && (
          <div className="mt-4 flex flex-col gap-4">
            <p className="text-sm text-white/70">
              Scan this QR code with your authenticator app, then enter the 6-digit code it shows.
            </p>
            <div
              className="w-fit rounded-lg bg-white p-3"
              dangerouslySetInnerHTML={{ __html: enrollment.qrCode }}
            />
            <p className="text-xs text-white/50">
              Can&apos;t scan it? Enter this code manually:{" "}
              <code className="rounded bg-black/30 px-1.5 py-0.5 text-white">
                {enrollment.secret}
              </code>
            </p>

            <form onSubmit={handleVerify} className="flex flex-col gap-3">
              <input
                type="text"
                inputMode="numeric"
                required
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                placeholder="123456"
                className="w-40 rounded border border-white/10 bg-white/5 px-3 py-2 text-center text-lg tracking-[0.5em] text-white placeholder-white/30 outline-none transition focus:border-brand-red-500"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={busy || code.length !== 6}
                  className="rounded bg-brand-cta px-4 py-2 text-sm font-medium text-white shadow-[0_4px_15px_rgba(148,13,13,0.3)] transition hover:bg-brand-cta-hover disabled:opacity-50"
                >
                  {busy ? "Verifying..." : "Verify & enable"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEnrollment(null);
                    setCode("");
                  }}
                  className="rounded border border-white/10 bg-white/5 px-4 py-2 text-sm text-white transition hover:bg-white/10"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {error && <p className="mt-3 text-sm text-brand-red-400">{error}</p>}
      </div>

      <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-6 shadow-[0_10px_30px_rgba(0,0,0,0.3)]">
        <h2 className="text-lg font-medium text-white">Sessions</h2>
        <p className="mt-2 text-sm text-white/60">
          If you think your account was signed in somewhere you don&apos;t recognize, you can sign
          out of every other session at once. This browser stays signed in.
        </p>
        <button
          onClick={handleSignOutOthers}
          disabled={signingOutOthers}
          className="mt-4 rounded border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10 disabled:opacity-50"
        >
          {signingOutOthers ? "Signing out..." : "Log out of all other sessions"}
        </button>
        {signOutOthersMessage && (
          <p className="mt-3 text-sm text-white/60">{signOutOthersMessage}</p>
        )}
      </div>
    </div>
  );
}
