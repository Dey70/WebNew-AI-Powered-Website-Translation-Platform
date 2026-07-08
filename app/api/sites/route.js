import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { createSite, listSites } from "@/lib/sites";
import { userHasProjectAccess } from "@/lib/projects";

export async function GET(request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ success: false, error: "unauthenticated" }, { status: 401 });
  }

  const projectId = new URL(request.url).searchParams.get("projectId") || undefined;

  // listSites trusts the caller to have already verified project access when
  // a projectId is given (it lists every site in the project, not just the
  // caller's own) -- this is that check.
  if (projectId && !(await userHasProjectAccess({ userId: user.id, projectId }))) {
    return NextResponse.json({ success: false, error: "not_found" }, { status: 404 });
  }

  const data = await listSites({ userId: user.id, projectId });
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

  const result = await createSite({
    userId: user.id,
    userEmail: user.email,
    projectId: body.projectId || null,
    name,
    allowedOrigins: body.allowedOrigins,
  });

  if (!result.ok) {
    const status =
      result.error === "project_not_found"
        ? 404
        : result.error === "at_least_one_origin_required"
        ? 400
        : 500;
    return NextResponse.json({ success: false, error: result.error }, { status });
  }

  // apiKey is the raw key -- returned once here, never persisted beyond this response.
  return NextResponse.json(
    { success: true, data: result.data, apiKey: result.apiKey },
    { status: 201 }
  );
}
