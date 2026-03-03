import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

/**
 * GET /api/languages
 * Returns all active language configs stored in Firestore.
 * Public — no auth required.
 */
export async function GET() {
  const snap = await adminDb.collection("languages").orderBy("name").get();

  const languages = snap.docs.map((d) => d.data());
  return NextResponse.json(languages);
}
