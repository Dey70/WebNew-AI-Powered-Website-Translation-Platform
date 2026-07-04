import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div>
      <h1 className="text-2xl font-semibold">Welcome{user?.email ? `, ${user.email}` : ""}</h1>
      <p className="mt-2 text-slate-600">
        Your account is set up. Projects, sites, and API key management are
        coming in the next milestone.
      </p>
    </div>
  );
}
