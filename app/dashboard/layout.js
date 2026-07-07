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

  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between border-b border-white/10 bg-white/5 px-6 py-4 backdrop-blur">
        <span className="text-lg font-semibold text-white">WebNew</span>
        <div className="flex items-center gap-4">
          <span className="text-sm text-white/60">{user.email}</span>
          <LogoutButton />
        </div>
      </header>
      <main className="px-6 py-8">{children}</main>
    </div>
  );
}
