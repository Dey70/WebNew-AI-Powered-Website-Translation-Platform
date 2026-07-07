import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LogoutButton from "./logout-button";

export default async function DashboardLayout({ children }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // The actual 2FA enforcement boundary -- runs on every dashboard page load
  // regardless of how the session was created (password, Google, GitHub), so
  // there's no path that skips it. A session at aal1 with a verified TOTP
  // factor enrolled must complete the challenge before seeing anything here.
  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal && aal.nextLevel === "aal2" && aal.currentLevel !== aal.nextLevel) {
    redirect("/mfa-challenge");
  }

  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between border-b border-white/10 bg-white/5 px-6 py-4 backdrop-blur">
        <span className="text-lg font-semibold text-white">WebNew</span>
        <div className="flex items-center gap-4">
          <Link href="/dashboard/security" className="text-sm text-white/60 hover:text-white">
            Security
          </Link>
          <span className="text-sm text-white/60">{user.email}</span>
          <LogoutButton />
        </div>
      </header>
      <main className="px-6 py-8">{children}</main>
    </div>
  );
}
