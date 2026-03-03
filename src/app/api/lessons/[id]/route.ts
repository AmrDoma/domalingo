import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { apiError } from "@/lib/api-auth";
import { Lesson } from "@/types";

function requireAdminKey(req: NextRequest): NextResponse | null {
  const secret = process.env.ADMIN_SECRET;
  const key = req.headers.get("x-admin-key");
  if (!secret) return apiError("ADMIN_SECRET not configured", 500);
  if (key !== secret) return apiError("Unauthorized", 401);
  return null;
}

/** GET /api/lessons/[id] — full lesson with items (public) */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const doc = await adminDb.collection("lessons").doc(id).get();
  if (!doc.exists) return apiError("Lesson not found", 404);
  return NextResponse.json({ id: doc.id, ...doc.data() });
}

/** PUT /api/lessons/[id] — full replace (admin only) */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authErr = requireAdminKey(req);
  if (authErr) return authErr;

  const { id } = await params;
  let body: Partial<Lesson>;
  try {
    body = await req.json();
  } catch {
    return apiError("Invalid JSON body.");
  }

  const existing = await adminDb.collection("lessons").doc(id).get();
  if (!existing.exists) return apiError("Lesson not found", 404);

  const merged = { ...existing.data(), ...body, id };
  await adminDb.collection("lessons").doc(id).set(merged);
  return NextResponse.json({ id, updated: true });
}

/** DELETE /api/lessons/[id] — remove lesson (admin only) */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authErr = requireAdminKey(req);
  if (authErr) return authErr;

  const { id } = await params;
  const snap = await adminDb.collection("lessons").doc(id).get();
  if (!snap.exists) return apiError("Lesson not found", 404);

  await adminDb.collection("lessons").doc(id).delete();
  return NextResponse.json({ id, deleted: true });
}
