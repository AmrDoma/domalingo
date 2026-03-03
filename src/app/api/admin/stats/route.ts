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

/** GET /api/admin/stats — aggregate counts for the overview dashboard */
export async function GET(req: NextRequest) {
  const authErr = requireAdminKey(req);
  if (authErr) return authErr;

  const [lessonsSnap, usersSnap] = await Promise.all([
    adminDb.collection("lessons").get(),
    adminDb.collection("users").get(),
  ]);

  const lessonsByLanguage: Record<string, number> = {};
  for (const d of lessonsSnap.docs) {
    const lang = d.data().language ?? "unknown";
    lessonsByLanguage[lang] = (lessonsByLanguage[lang] ?? 0) + 1;
  }

  const totalWords = lessonsSnap.docs.reduce(
    (sum, d) => sum + ((d.data().items as unknown[]) ?? []).length,
    0,
  );

  return NextResponse.json({
    totalLessons: lessonsSnap.size,
    totalUsers: usersSnap.size,
    totalWords,
    lessonsByLanguage,
  });
}
