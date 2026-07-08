import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { removeMember } from "@/lib/projects";

export async function DELETE(request, { params }) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ success: false, error: "unauthenticated" }, { status: 401 });
  }

  const { id, userId } = await params;
  const result = await removeMember({ ownerId: user.id, projectId: id, memberUserId: userId });
  if (!result.ok) {
    const status = result.error === "not_found" ? 404 : 500;
    return NextResponse.json({ success: false, error: result.error }, { status });
  }
  return NextResponse.json({ success: true });
}
