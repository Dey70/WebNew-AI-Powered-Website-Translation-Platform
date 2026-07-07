"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut({ scope: "global" });
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="rounded border border-white/10 bg-white/5 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-white/10"
    >
      Log out
    </button>
  );
}
