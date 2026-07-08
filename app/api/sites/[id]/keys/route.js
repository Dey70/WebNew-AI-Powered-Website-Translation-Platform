import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { createApiKey } from "@/lib/sites";

export async function POST(request, { params }) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ success: false, error: "unauthenticated" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const label = typeof body.label === "string" ? body.label.trim() || null : null;

  const result = await createApiKey({ userId: user.id, siteId: id, label });
  if (!result.ok) {
    const status =
      result.error === "not_found" ? 404 : result.error === "too_many_active_keys" ? 400 : 500;
    return NextResponse.json({ success: false, error: result.error }, { status });
  }

  // apiKey is the raw key -- returned once here, never persisted beyond this response.
  return NextResponse.json({ success: true, apiKey: result.apiKey }, { status: 201 });
}
