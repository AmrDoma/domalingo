import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { apiError } from "@/lib/api-auth";

function requireAdminKey(req: NextRequest): NextResponse | null {
  const secret = process.env.ADMIN_SECRET;
  const key = req.headers.get("x-admin-key");
  if (!secret) return apiError("ADMIN_SECRET not configured", 500);
  if (key !== secret) return apiError("Unauthorized", 401);
  return null;
}

/**
 * GET /api/admin/lessons
 * Returns ALL lessons across all languages (admin only).
 * Each lesson includes its full items array.
 */
export async function GET(req: NextRequest) {
  const authErr = requireAdminKey(req);
  if (authErr) return authErr;

  const snap = await adminDb
    .collection("lessons")
    .orderBy("language")
    .orderBy("category")
    .get();

  const lessons = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  return NextResponse.json(lessons);
}
