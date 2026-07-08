import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { listPendingInvitesForUser } from "@/lib/projects";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ success: false, error: "unauthenticated" }, { status: 401 });
  }

  const data = await listPendingInvitesForUser({ userId: user.id });
  return NextResponse.json({ success: true, data });
}
