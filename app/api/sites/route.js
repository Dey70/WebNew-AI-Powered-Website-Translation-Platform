import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { createSite, listSites } from "@/lib/sites";

export async function GET(request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ success: false, error: "unauthenticated" }, { status: 401 });
  }

  const projectId = new URL(request.url).searchParams.get("projectId") || undefined;
  const data = await listSites({ ownerId: user.id, projectId });
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
    ownerId: user.id,
    ownerEmail: user.email,
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
