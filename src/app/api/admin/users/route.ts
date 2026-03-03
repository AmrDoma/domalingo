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
 * GET /api/admin/users
 * Returns all user profiles (admin only).
 */
export async function GET(req: NextRequest) {
  const authErr = requireAdminKey(req);
  if (authErr) return authErr;

  const snap = await adminDb
    .collection("users")
    .orderBy("createdAt", "desc")
    .get();

  const users = snap.docs.map((d) => {
    const data = d.data();
    return {
      uid: d.id,
      displayName: data.displayName ?? "—",
      email: data.email ?? "—",
      activeLanguage: data.activeLanguage ?? "—",
      targetLanguages: data.targetLanguages ?? [],
      streakCount: data.streakCount ?? 0,
      totalXP: data.totalXP ?? 0,
      lastSessionDate: data.lastSessionDate ?? null,
      createdAt: data.createdAt ?? null,
    };
  });

  return NextResponse.json(users);
}
