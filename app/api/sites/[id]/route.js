import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { getSite, updateSite, deleteSite } from "@/lib/sites";

export async function GET(request, { params }) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ success: false, error: "unauthenticated" }, { status: 401 });
  }

  const { id } = await params;
  const site = await getSite({ ownerId: user.id, id });
  if (!site) {
    return NextResponse.json({ success: false, error: "not_found" }, { status: 404 });
  }
  return NextResponse.json({ success: true, data: site });
}

export async function PATCH(request, { params }) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ success: false, error: "unauthenticated" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => ({}));

  const result = await updateSite({
    ownerId: user.id,
    id,
    name: typeof body.name === "string" ? body.name.trim() : undefined,
    allowedOrigins: body.allowedOrigins,
    isActive: typeof body.isActive === "boolean" ? body.isActive : undefined,
  });

  if (!result.ok) {
    const status =
      result.error === "not_found"
        ? 404
        : result.error === "at_least_one_origin_required" || result.error === "nothing_to_update"
        ? 400
        : 500;
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
  const result = await deleteSite({ ownerId: user.id, id });
  if (!result.ok) {
    return NextResponse.json({ success: false, error: result.error }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
