import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { revokeApiKey } from "@/lib/sites";

export async function DELETE(request, { params }) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ success: false, error: "unauthenticated" }, { status: 401 });
  }

  const { id, keyId } = await params;
  const result = await revokeApiKey({ ownerId: user.id, siteId: id, keyId });
  if (!result.ok) {
    const status = result.error === "not_found" ? 404 : 500;
    return NextResponse.json({ success: false, error: result.error }, { status });
  }
  return NextResponse.json({ success: true });
}
