import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { respondToInvite } from "@/lib/projects";

export async function PATCH(request, { params }) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ success: false, error: "unauthenticated" }, { status: 401 });
  }

  const { projectId } = await params;
  const result = await respondToInvite({ userId: user.id, projectId, accept: true });
  if (!result.ok) {
    const status = result.error === "not_found" ? 404 : 500;
    return NextResponse.json({ success: false, error: result.error }, { status });
  }
  return NextResponse.json({ success: true });
}

export async function DELETE(request, { params }) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ success: false, error: "unauthenticated" }, { status: 401 });
  }

  const { projectId } = await params;
  const result = await respondToInvite({ userId: user.id, projectId, accept: false });
  if (!result.ok) {
    const status = result.error === "not_found" ? 404 : 500;
    return NextResponse.json({ success: false, error: result.error }, { status });
  }
  return NextResponse.json({ success: true });
}
