import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { revokeAndRegenerateKey } from "@/lib/sites";

export async function POST(request, { params }) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ success: false, error: "unauthenticated" }, { status: 401 });
  }

  const { id } = await params;
  const result = await revokeAndRegenerateKey({ ownerId: user.id, siteId: id });
  if (!result.ok) {
    const status = result.error === "not_found" ? 404 : 500;
    return NextResponse.json({ success: false, error: result.error }, { status });
  }

  // apiKey is the new raw key -- returned once here, never persisted beyond this response.
  return NextResponse.json({ success: true, apiKey: result.apiKey });
}
