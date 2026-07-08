import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { getProject, renameProject, setProjectArchived, deleteProject } from "@/lib/projects";

export async function GET(request, { params }) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ success: false, error: "unauthenticated" }, { status: 401 });
  }

  const { id } = await params;
  const project = await getProject({ userId: user.id, id });
  if (!project) {
    return NextResponse.json({ success: false, error: "not_found" }, { status: 404 });
  }
  return NextResponse.json({
    success: true,
    data: { ...project, isOwner: project.owner_id === user.id },
  });
}

export async function PATCH(request, { params }) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ success: false, error: "unauthenticated" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => ({}));

  let result;
  if (typeof body.name === "string") {
    const name = body.name.trim();
    if (!name) {
      return NextResponse.json({ success: false, error: "name_required" }, { status: 400 });
    }
    result = await renameProject({ ownerId: user.id, id, name });
  } else if (typeof body.archived === "boolean") {
    result = await setProjectArchived({ ownerId: user.id, id, archived: body.archived });
  } else {
    return NextResponse.json({ success: false, error: "nothing_to_update" }, { status: 400 });
  }

  if (!result.ok) {
    const status = result.error === "not_found" ? 404 : 500;
    return NextResponse.json({ success: false, error: result.error }, { status });
  }
  return NextResponse.json({ success: true, data: result.data });
}

export async function DELETE(request, { params }) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ success: false, error: "unauthenticated" }, { status: 401 });
  }

  const { id } = await params;
  const result = await deleteProject({ ownerId: user.id, id });
  if (!result.ok) {
    return NextResponse.json({ success: false, error: result.error }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
