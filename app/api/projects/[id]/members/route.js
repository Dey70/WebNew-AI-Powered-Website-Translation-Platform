import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { listMembers, inviteMember } from "@/lib/projects";

export async function GET(request, { params }) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ success: false, error: "unauthenticated" }, { status: 401 });
  }

  const { id } = await params;
  const data = await listMembers({ userId: user.id, projectId: id });
  return NextResponse.json({ success: true, data });
}

export async function POST(request, { params }) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ success: false, error: "unauthenticated" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const email = typeof body.email === "string" ? body.email.trim() : "";
  if (!email) {
    return NextResponse.json({ success: false, error: "email_required" }, { status: 400 });
  }

  const result = await inviteMember({ ownerId: user.id, projectId: id, email });
  if (!result.ok) {
    const status =
      result.error === "not_found"
        ? 404
        : result.error === "no_account_for_email" ||
          result.error === "already_a_member" ||
          result.error === "already_owner"
        ? 400
        : 500;
    return NextResponse.json({ success: false, error: result.error }, { status });
  }
  return NextResponse.json({ success: true, data: result.data }, { status: 201 });
}
