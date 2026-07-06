import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { createProject, listProjects } from "@/lib/projects";

export async function GET(request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ success: false, error: "unauthenticated" }, { status: 401 });
  }

  const includeArchived = new URL(request.url).searchParams.get("includeArchived") === "true";
  const data = await listProjects({ ownerId: user.id, includeArchived });
  return NextResponse.json({ success: true, data });
}

export async function POST(request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ success: false, error: "unauthenticated" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) {
    return NextResponse.json({ success: false, error: "name_required" }, { status: 400 });
  }

  const result = await createProject({ ownerId: user.id, name });
  if (!result.ok) {
    return NextResponse.json({ success: false, error: result.error }, { status: 500 });
  }
  return NextResponse.json({ success: true, data: result.data }, { status: 201 });
}
