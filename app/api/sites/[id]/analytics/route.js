import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { userCanAccessSite } from "@/lib/sites";
import { getSiteAnalytics } from "@/lib/analytics";

export async function GET(request, { params }) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ success: false, error: "unauthenticated" }, { status: 401 });
  }

  const { id } = await params;
  if (!(await userCanAccessSite({ userId: user.id, siteId: id }))) {
    return NextResponse.json({ success: false, error: "not_found" }, { status: 404 });
  }

  const data = await getSiteAnalytics({ siteId: id });
  return NextResponse.json({ success: true, data });
}
