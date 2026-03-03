import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { verifyAuth, isAuthError, apiError } from "@/lib/api-auth";
import { UserProfile, LanguageCode } from "@/types";
import { today } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────────
// GET /api/profile
// ─────────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const decoded = await verifyAuth(req);
  if (isAuthError(decoded)) return decoded;

  const snap = await adminDb.collection("users").doc(decoded.uid).get();
  if (!snap.exists) return apiError("Profile not found", 404);

  return NextResponse.json(snap.data());
}

// ─────────────────────────────────────────────────────────────────
// PUT /api/profile
// ─────────────────────────────────────────────────────────────────
export async function PUT(req: NextRequest) {
  const decoded = await verifyAuth(req);
  if (isAuthError(decoded)) return decoded;

  const uid = decoded.uid;
  const body = (await req.json()) as Partial<UserProfile>;

  // Only allow mutable fields
  const allowed: Partial<UserProfile> = {};
  if (body.activeLanguage)
    allowed.activeLanguage = body.activeLanguage as LanguageCode;
  if (body.targetLanguages) allowed.targetLanguages = body.targetLanguages;
  if (body.displayName) allowed.displayName = body.displayName;

  const ref = adminDb.collection("users").doc(uid);
  const snap = await ref.get();

  if (!snap.exists) {
    // First-time profile creation (edge case: called before Google sign-in flow creates it)
    const newProfile: UserProfile = {
      uid,
      displayName: decoded.name ?? "Learner",
      email: decoded.email ?? "",
      photoURL: decoded.picture ?? "",
      targetLanguages: ["de" as LanguageCode],
      activeLanguage: "de" as LanguageCode,
      streakCount: 0,
      lastSessionDate: null,
      totalXP: 0,
      createdAt: Date.now(),
      ...allowed,
    };
    await ref.set(newProfile);
    return NextResponse.json(newProfile);
  }

  await ref.update(allowed as Record<string, unknown>);
  const updated = await ref.get();
  return NextResponse.json(updated.data());
}
